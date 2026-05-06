"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBuddy } from "@/lib/store";
import { getCharacter } from "@/lib/characters";

const MOOD_EMOJI: Record<string, string> = {
  very_low: "🌧 とてもしんどそう",
  low: "☁️ ちょっと元気がない",
  okay: "🌤 ふつう",
  good: "☀️ 元気そう",
  very_good: "🌈 とても元気",
};

export default function MemoPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const { sessions, childName } = useBuddy();

  // 最新の終了済みセッション
  const latest = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .find((s) => s.endedAt) ?? sessions[0] ?? null;
  }, [sessions]);

  const character = latest ? getCharacter(latest.characterId) : null;
  const sum = latest?.summary ?? null;

  function share() {
    if (!sum) return;
    const lines = [
      `📝 ${childName || "お子さま"}のきょうのメモ`,
      "",
      `気分: ${MOOD_EMOJI[sum.mood] ?? sum.mood}`,
      sum.topics.length > 0 ? `話した話題:\n${sum.topics.map((t) => `・${t}`).join("\n")}` : "",
      sum.happy.length > 0 ? `うれしかったこと:\n${sum.happy.map((h) => `・${h}`).join("\n")}` : "",
      sum.worries.length > 0 ? `気になってたこと:\n${sum.worries.map((w) => `・${w}`).join("\n")}` : "",
      "",
      sum.parentNote,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      void navigator.share({ title: "もこもこフレンド メモ", text: lines });
    } else {
      void navigator.clipboard.writeText(lines).then(() => alert("コピーしました！"));
    }
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100" />;
  }

  if (!latest || !sum) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100 flex flex-col items-center justify-center px-5 text-slate-700">
        <p className="text-4xl mb-4">📝</p>
        <p className="text-lg font-bold">まだメモがありません</p>
        <p className="text-sm text-slate-500 mt-1 text-center">おしゃべりを「おわる」にするとメモが作られるよ</p>
        <Link href="/" className="mt-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold px-8 py-3 shadow">
          ホームへ
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-purple-50 text-slate-800">
      <div className="mx-auto max-w-md px-5 pt-8 pb-24">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-rose-400">← ホーム</Link>
          <button
            onClick={share}
            className="text-xs px-3 py-1.5 rounded-full bg-white/80 border border-rose-200 text-rose-500 font-semibold"
          >
            共有 ↗
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-black text-rose-500">きょうのメモ 📝</h1>
        <p className="text-sm text-slate-500 mt-1">
          {character?.name ?? "?"} と {childName || "きみ"} のおしゃべり ·{" "}
          {new Date(latest.startedAt).toLocaleString("ja-JP", {
            month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>

        {/* 気分 */}
        <div className="mt-6 rounded-2xl bg-white/80 p-4 border border-white/60 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1">きょうの気分</p>
          <p className="text-lg font-bold">{MOOD_EMOJI[sum.mood] ?? sum.mood}</p>
        </div>

        {/* 話題 */}
        {sum.topics.length > 0 && (
          <Section title="話した話題 💬" items={sum.topics} color="bg-sky-50 border-sky-100" />
        )}

        {/* うれしかったこと */}
        {sum.happy.length > 0 && (
          <Section title="うれしかったこと ☀️" items={sum.happy} color="bg-amber-50 border-amber-100" />
        )}

        {/* 気になってたこと */}
        {sum.worries.length > 0 && (
          <Section title="気になってたこと 🌧" items={sum.worries} color="bg-violet-50 border-violet-100" />
        )}

        {/* 緊急フラグ */}
        {sum.flags.urgent && (
          <div className="mt-4 rounded-2xl bg-rose-500 text-white p-4">
            <p className="font-bold">⚠ 至急：おうちの人に確認をおすすめします</p>
            {sum.flags.urgentReason && (
              <p className="mt-1 text-sm">{sum.flags.urgentReason}</p>
            )}
            <p className="mt-2 text-xs opacity-80">よりそいホットライン: 0120-279-338（24時間・無料）</p>
          </div>
        )}

        {/* おうちの人へのメモ */}
        <div className="mt-4 rounded-2xl bg-white/80 p-4 border border-white/60 shadow-sm">
          <p className="text-xs font-bold text-rose-500 mb-2">おうちの人へ 👨‍👩‍👧</p>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{sum.parentNote}</p>
        </div>

        {/* ボタン */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/chat"
            className="flex-1 text-center rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-3 shadow active:scale-95 transition"
          >
            またおしゃべりする
          </Link>
          <Link
            href="/"
            className="flex-1 text-center rounded-full bg-white/80 text-rose-500 font-semibold py-3 border border-rose-200 active:scale-95 transition"
          >
            ホームへ
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className={`mt-4 rounded-2xl p-4 border ${color}`}>
      <p className="text-xs font-bold text-slate-500 mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-rose-400 mt-0.5">・</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
