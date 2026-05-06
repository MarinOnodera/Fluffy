"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const MOOD_EMOJI: Record<string, string> = {
  very_low: "🌧 とてもしんどそう",
  low: "☁️ ちょっと元気がない",
  okay: "🌤 ふつう",
  good: "☀️ 元気そう",
  very_good: "🌈 とても元気",
};

interface SharedSession {
  id: string;
  characterName: string;
  childName: string;
  startedAt: string;
  summary: {
    parentNote: string;
    mood: string;
    topics: string[];
    happy: string[];
    worries: string[];
    flags: {
      bullying: boolean; school: boolean; family: boolean; body: boolean;
      prolongedSadness: boolean; urgent: boolean; urgentReason?: string;
    };
    at: string;
  };
}

export default function FamilyViewPage() {
  const { code } = useParams<{ code: string }>();
  const [sessions, setSessions] = useState<SharedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/family?code=${code}`)
      .then((r) => r.json())
      .then((data: { sessions?: SharedSession[]; error?: string }) => {
        if (data.error) setError(data.error);
        else setSessions(data.sessions ?? []);
      })
      .catch(() => setError("読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [code]);

  const urgent = sessions.filter((s) => s.summary?.flags.urgent);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">よみこみちゅう…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50 flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-slate-700 font-bold">エラーが発生しました</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <p className="text-xs text-slate-400 mt-4">Vercel KV の設定を確認してください</p>
      </main>
    );
  }

  if (sessions.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50 flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-slate-700 font-bold">まだ記録がありません</p>
        <p className="text-sm text-slate-500 mt-1">おしゃべりが終わると自動で届きます</p>
      </main>
    );
  }

  const childName = sessions[0]?.childName || "お子さま";
  const open = openId ? sessions.find((s) => s.id === openId) ?? null : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-rose-50 to-pink-50 text-slate-800">
      <div className="mx-auto max-w-md px-5 pt-8 pb-24">
        <h1 className="text-2xl font-black text-slate-700">
          {childName} のようす
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          おしゃべりの自動メモ（{sessions.length} 件）
        </p>
        <p className="text-xs text-slate-400 mt-0.5">コード: {String(code).toUpperCase()}</p>

        {urgent.length > 0 && (
          <div className="mt-4 rounded-2xl bg-rose-100 border border-rose-300 p-4">
            <p className="font-bold text-rose-700">
              ⚠ 注意が必要な会話があります（{urgent.length} 件）
            </p>
            <p className="text-xs text-rose-700 mt-1">
              赤ラベルのセッションを確認してください。
              よりそいホットライン: 0120-279-338（24時間・無料）
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {sessions.map((s) => {
            const sum = s.summary;
            const mood = MOOD_EMOJI[sum?.mood] ?? "";
            const flagLabels = sum ? [
              sum.flags.urgent ? "至急" : null,
              sum.flags.bullying ? "いじめ" : null,
              sum.flags.family ? "家族" : null,
              sum.flags.school ? "学校" : null,
              sum.flags.body ? "体調" : null,
              sum.flags.prolongedSadness ? "悲しみ続く" : null,
            ].filter(Boolean) as string[] : [];

            return (
              <button
                key={s.id}
                onClick={() => setOpenId(s.id)}
                className={`w-full text-left rounded-2xl p-4 border shadow-sm transition active:scale-[0.99] ${
                  sum?.flags.urgent ? "bg-rose-50 border-rose-300" : "bg-white/90 border-white/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-700">
                    {s.characterName} ·{" "}
                    {new Date(s.startedAt).toLocaleString("ja-JP", {
                      month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  {mood && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {mood}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {sum?.parentNote ?? "(要約なし)"}
                </p>
                {flagLabels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {flagLabels.map((f) => (
                      <span key={f} className={`text-[10px] px-2 py-0.5 rounded-full ${
                        f === "至急" ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-700"
                      }`}>{f}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setOpenId(null)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-700">{open.characterName} との おしゃべり</p>
              <button onClick={() => setOpenId(null)} className="text-slate-400 text-xl">×</button>
            </div>
            <p className="text-xs text-slate-500">{new Date(open.startedAt).toLocaleString("ja-JP")}</p>
            <p className="text-xs mt-1 font-semibold">{MOOD_EMOJI[open.summary?.mood] ?? ""}</p>

            {open.summary && (
              <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-100 p-3">
                <p className="text-xs font-bold text-rose-600">自動メモ</p>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{open.summary.parentNote}</p>
                {open.summary.flags.urgent && open.summary.flags.urgentReason && (
                  <div className="mt-3 rounded-xl bg-rose-500 text-white p-3 text-sm">
                    <p className="font-bold">⚠ 至急の確認をおすすめします</p>
                    <p className="mt-1">{open.summary.flags.urgentReason}</p>
                  </div>
                )}
                {open.summary.topics.length > 0 && (
                  <Detail title="話題" items={open.summary.topics} />
                )}
                {open.summary.happy.length > 0 && (
                  <Detail title="うれしかったこと" items={open.summary.happy} />
                )}
                {open.summary.worries.length > 0 && (
                  <Detail title="気になっていたこと" items={open.summary.worries} />
                )}
              </div>
            )}
            <button onClick={() => setOpenId(null)}
              className="mt-4 w-full rounded-full bg-slate-700 text-white font-bold py-2">
              閉じる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold text-slate-500">{title}</p>
      <ul className="mt-1 list-disc list-inside text-sm text-slate-700 space-y-0.5">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}
