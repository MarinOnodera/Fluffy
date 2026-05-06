"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBuddy } from "@/lib/store";
import { getCharacter } from "@/lib/characters";
import { FluffyAvatar } from "@/components/FluffyAvatar";
import type { BuddyMessage, BuddySession } from "@/lib/types";

const SESSION_MSG_SOFT_LIMIT = 60;

export default function BuddyChatPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    selectedCharacterId,
    childName,
    childAge,
    sessions,
    activeSessionId,
    familyCode,
    startSession,
    endActiveSession,
    appendMessage,
    setSessionSummary,
  } = useBuddy();

  const character = getCharacter(selectedCharacterId);
  const activeSession: BuddySession | null = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!character) router.replace("/select");
  }, [hydrated, character, router]);

  useEffect(() => {
    if (!hydrated || !character) return;
    if (activeSession) return;
    const id = startSession();
    if (!id) return;
    void greet(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, character]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeSession?.messages.length]);

  // TTS
  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.88;
    utterance.pitch = 1.1;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  // STT
  function startListening() {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition as
        | (new () => SpeechRecognitionInstance)
        | undefined ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as
        | (new () => SpeechRecognitionInstance)
        | undefined;
    if (!SR) {
      alert("このブラウザは音声入力に対応していません。Chromeをお試しください。");
      return;
    }
    stopSpeaking();
    const rec = new SR() as SpeechRecognitionInstance;
    recognitionRef.current = rec;
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setIsListening(false);
      void sendText(text);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  }

  function stopListening() {
    (recognitionRef.current as SpeechRecognitionInstance | null)?.stop();
    setIsListening(false);
  }

  if (!hydrated || !character) {
    return <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100" />;
  }

  async function greet(sessionId: string) {
    if (!character) return;
    setSending(true);
    try {
      // 過去の完了済みセッション数と直近の要約を使って挨拶を変える
      const pastSessions = sessions.filter((s) => s.endedAt && s.id !== sessionId);
      const lastSummary = pastSessions[0]?.summary;
      const isFirstEver = pastSessions.length === 0;

      let systemNote: string;
      if (isFirstEver) {
        systemNote =
          "(システム: 初めてのおしゃべり。やさしく自己紹介して、子どもの名前を聞き、今日の気分を1つだけ自然に聞いてあげて。)";
      } else {
        const lastContext = lastSummary
          ? [
              lastSummary.mood === "very_low" || lastSummary.mood === "low"
                ? "前回すこし元気がなさそうだった" : null,
              lastSummary.topics.length ? `前回は「${lastSummary.topics[0]}」の話をしてたよ` : null,
            ].filter(Boolean).join("、")
          : "";
        systemNote =
          `(システム: ${pastSessions.length}回目のおしゃべり。久しぶりに会う友達のように、あたたかく再会を喜んで。初めましてはNG。` +
          (lastContext ? `${lastContext}。` : "") +
          `今日の様子を1つだけ自然に聞いてあげて。)`;
      }

      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          character: {
            name: character.name,
            vibe: character.vibe,
            firstPerson: character.firstPerson,
            speechSample: character.speechSample,
          },
          childName: childName || "",
          childAge: childAge ?? null,
          history: [],
          userText: systemNote,
        }),
      });
      const text = r.ok ? ((await r.json()) as { text?: string }).text : null;
      const reply = text ?? (childName
        ? `${childName}、きょうはどんな1日だった？`
        : "やっほー！きょうはどんな1日だった？");
      appendMessage(sessionId, { role: "buddy", text: reply });
      if (voiceMode) speak(reply);
    } catch {
      const fallback = childName
        ? `${childName}、きょうはどんな1日だった？`
        : "やっほー！きょうはどんな1日だった？";
      appendMessage(sessionId, { role: "buddy", text: fallback });
      if (voiceMode) speak(fallback);
    } finally {
      setSending(false);
    }
  }

  async function sendText(text: string) {
    if (!text.trim() || sending || !activeSession || !character) return;
    appendMessage(activeSession.id, { role: "user", text });
    setSending(true);
    try {
      const history = [...activeSession.messages, {
        id: "tmp", role: "user" as const, text, at: new Date().toISOString(),
      }].slice(-14).map((m) => ({ role: m.role, text: m.text }));

      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          character: {
            name: character.name, vibe: character.vibe,
            firstPerson: character.firstPerson, speechSample: character.speechSample,
          },
          childName,
          childAge: childAge ?? null,
          history,
          userText: text,
        }),
      });
      const reply = r.ok
        ? ((await r.json()) as { text?: string }).text ?? "うん、うん。それで…？"
        : "ごめんね、いま すこし おみみが とおいみたい。";
      appendMessage(activeSession.id, { role: "buddy", text: reply });
      if (voiceMode) speak(reply);
    } catch {
      const err = "ごめんね、ちょっと くもの上に いきそうだった。もういちど いってくれる？";
      appendMessage(activeSession.id, { role: "buddy", text: err });
      if (voiceMode) speak(err);
    } finally {
      setSending(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendText(text);
  }

  async function endAndSummarize() {
    if (!activeSession) { router.push("/"); return; }
    setShowEnd(false);
    setSending(true);
    stopSpeaking();
    try {
      const r = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childName,
          characterName: character?.name ?? "",
          messages: activeSession.messages.map((m) => ({ role: m.role, text: m.text, at: m.at })),
        }),
      });
      if (r.ok) {
        const j = (await r.json()) as { summary?: BuddySummaryDto };
        if (j.summary) {
          const summaryData = {
            parentNote: j.summary.parentNote,
            mood: j.summary.mood,
            topics: j.summary.topics,
            happy: j.summary.happy,
            worries: j.summary.worries,
            flags: j.summary.flags,
            at: j.summary.at,
          };
          setSessionSummary(activeSession.id, summaryData);
          void fetch("/api/family", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              familyCode,
              session: {
                id: activeSession.id,
                characterName: character?.name ?? "",
                childName,
                startedAt: activeSession.startedAt,
                summary: summaryData,
              },
            }),
          });
        }
      }
    } catch { /* 要約失敗してもセッション終了はする */ }
    finally {
      endActiveSession();
      setSending(false);
      router.push("/memo");
    }
  }

  const messages = activeSession?.messages ?? [];
  const overSoftLimit = messages.length >= SESSION_MSG_SOFT_LIMIT;

  return (
    <main className={`min-h-screen flex flex-col bg-gradient-to-b ${character.bgClass} text-slate-800`}>
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 border-b border-white/60">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-rose-500 text-sm">←</Link>
          <FluffyAvatar character={character} size={40} bouncing={isSpeaking} />
          <div className="flex-1">
            <p className="font-bold text-slate-700">{character.name}</p>
            <p className="text-[11px] text-slate-500">
              {isListening ? "🎤 きいてるよ…" : isSpeaking ? "💬 はなしちゅう" : sending ? "…かんがえちゅう" : "おはなし中"}
            </p>
          </div>
          {/* 声モード切り替え */}
          <button
            onClick={() => { stopSpeaking(); stopListening(); setVoiceMode((v) => !v); }}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${
              voiceMode
                ? "bg-rose-400 text-white border-rose-400"
                : "bg-white/80 border-rose-200 text-rose-500"
            }`}
          >
            {voiceMode ? "🎤 声" : "⌨️ 文字"}
          </button>
          <button
            onClick={() => setShowEnd(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/80 border border-rose-200 text-rose-500 font-semibold"
          >
            おしまい
          </button>
        </div>
      </header>

      {/* 声モード: アバター中央表示 */}
      {voiceMode ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <FluffyAvatar
            character={character}
            size={180}
            bouncing={isSpeaking}
          />
          <p className="text-slate-600 text-sm text-center">
            {isListening
              ? "🎤 はなしてね…"
              : isSpeaking
              ? `${character.name} がはなしてるよ`
              : sending
              ? "…かんがえちゅう"
              : "マイクボタンをおして話してね"}
          </p>
          {/* 直近のやりとりを小さく表示 */}
          {messages.length > 0 && (
            <div className="w-full max-w-sm space-y-2 max-h-40 overflow-y-auto">
              {messages.slice(-4).map((m) => (
                <p
                  key={m.id}
                  className={`text-xs rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-rose-100 text-rose-800 text-right ml-8"
                      : "bg-white/80 text-slate-700 mr-8"
                  }`}
                >
                  {m.text}
                </p>
              ))}
            </div>
          )}
          {/* 大きなマイクボタン */}
          <button
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={stopListening}
            disabled={sending || isSpeaking}
            className={`w-24 h-24 rounded-full shadow-xl flex items-center justify-center text-4xl transition active:scale-95 disabled:opacity-40 ${
              isListening
                ? "bg-red-400 animate-pulse"
                : "bg-gradient-to-br from-rose-400 to-pink-400"
            }`}
          >
            🎤
          </button>
          <p className="text-[11px] text-slate-400">押している間だけ話せるよ</p>
        </div>
      ) : (
        /* テキストモード: 従来のチャット表示 */
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 mx-auto max-w-md w-full">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <Bubble key={m.id} m={m} accent={character.accent} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 self-start">
                <FluffyAvatar character={character} size={32} />
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-white/70 text-slate-400 text-sm">
                  <span className="inline-block animate-pulse">・・・</span>
                </div>
              </div>
            )}
            {overSoftLimit && (
              <p className="text-[11px] text-center text-slate-500 mt-2">
                ながく おしゃべりしてくれたね。きりのいいところで「おしまい」をおしてもいいよ。
              </p>
            )}
          </div>
        </div>
      )}

      {!voiceMode && (
        <footer className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-white/70">
          <div className="mx-auto max-w-md px-3 py-3 flex gap-2 items-end">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ここに かいて しゃべろう"
              rows={1}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              className="flex-1 resize-none rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-slate-700 outline-none focus:border-rose-300 max-h-32"
            />
            <button
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold px-4 py-3 disabled:opacity-40 shadow active:scale-95 transition"
              aria-label="おくる"
            >
              ♡
            </button>
          </div>
        </footer>
      )}

      {showEnd && (
        <div
          className="fixed inset-0 z-30 bg-black/30 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowEnd(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-black text-slate-700">きょうの おしゃべりを おわる？</p>
            <p className="mt-2 text-sm text-slate-500">
              おわると、おしゃべりのメモが見られるよ。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowEnd(false)}
                className="flex-1 rounded-full bg-slate-100 text-slate-500 font-semibold py-3"
              >
                つづける
              </button>
              <button
                onClick={() => void endAndSummarize()}
                className="flex-1 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-3 shadow"
              >
                おわる
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes buddyBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
      `}</style>
    </main>
  );
}

function Bubble({ m, accent }: { m: BuddyMessage; accent: string }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-sm text-white"
            : "rounded-bl-sm bg-white text-slate-700 border border-white/70"
        }`}
        style={isUser ? { background: `linear-gradient(135deg, ${accent}, #ff7aa3)` } : undefined}
      >
        {m.text.split("\n").map((line, i) => <p key={i}>{line}</p>)}
      </div>
    </div>
  );
}

interface BuddySummaryDto {
  parentNote: string;
  mood: "very_low" | "low" | "okay" | "good" | "very_good";
  topics: string[];
  happy: string[];
  worries: string[];
  flags: {
    bullying: boolean; school: boolean; family: boolean; body: boolean;
    prolongedSadness: boolean; urgent: boolean; urgentReason?: string;
  };
  at: string;
}

// SpeechRecognition 型の簡易定義
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
