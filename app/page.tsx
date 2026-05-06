"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBuddy } from "@/lib/store";
import { getCharacter } from "@/lib/characters";
import { FluffyAvatar } from "@/components/FluffyAvatar";

export default function BuddyHome() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    selectedCharacterId,
    childName,
    childAge,
    agePromptShown,
    fontSize,
    sessions,
    parentPinHash,
    setChildAge,
    setAgePromptShown,
    setFontSize,
  } = useBuddy();
  const buddy = getCharacter(selectedCharacterId);

  // 初回年齢入力モーダル: まだ表示していないとき1回だけ
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageInput, setAgeInput] = useState("");

  useEffect(() => {
    if (hydrated && !agePromptShown) setShowAgeModal(true);
  }, [hydrated, agePromptShown]);

  function applyAge() {
    const n = parseInt(ageInput, 10);
    setChildAge(isNaN(n) || n <= 0 ? null : Math.min(n, 18));
    setAgePromptShown();
    setShowAgeModal(false);
  }

  function skipAge() {
    setAgePromptShown();
    setShowAgeModal(false);
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100" />;
  }

  const ageLabel =
    childAge === null ? null
    : childAge < 6 ? "全ひらがな"
    : childAge <= 8 ? "やさしい漢字"
    : childAge <= 11 ? "ふつうの漢字"
    : "通常";

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-purple-50 text-slate-800">
      <div className="mx-auto max-w-md px-5 pt-8 pb-24">
        {/* ヘッダー: 設定ボタン */}
        <div className="flex items-center justify-end">
          <Link href="/settings" className="text-xl p-1" aria-label="設定">⚙️</Link>
        </div>

        <h1 className="text-center font-black text-3xl text-rose-500 drop-shadow-sm mt-1">
          もこもこフレンド
        </h1>
        <p className="text-center text-sm text-slate-500 mt-1">
          おしゃべりすると、こころが軽くなるよ
        </p>

        {/* 文字サイズ 大中小 — 常時表示 */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400 mr-1">文字</span>
          {(["sm", "md", "lg"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`w-10 h-10 rounded-full font-bold border transition ${
                fontSize === s
                  ? "bg-rose-400 text-white border-rose-400 shadow"
                  : "bg-white/80 text-slate-500 border-rose-200"
              } ${s === "sm" ? "text-xs" : s === "lg" ? "text-lg" : "text-sm"}`}
            >
              {s === "sm" ? "小" : s === "lg" ? "大" : "中"}
            </button>
          ))}
          {ageLabel && (
            <span className="ml-2 text-[11px] text-slate-400 bg-white/70 rounded-full px-2 py-1">
              {childAge}さい・{ageLabel}
            </span>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center">
          {buddy ? (
            <>
              <FluffyAvatar character={buddy} size={180} bouncing />
              <p className="mt-5 text-lg font-bold">
                {buddy.name}
                {childName ? ` と ${childName}` : ""} のおしゃべり
              </p>
              <p className="mt-1 text-xs text-slate-500 text-center px-4">
                {buddy.vibe}
              </p>

              <Link
                href="/chat"
                className="mt-8 w-full text-center rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-4 shadow-lg active:scale-95 transition"
              >
                おしゃべりする
              </Link>
              <Link
                href="/select"
                className="mt-3 w-full text-center rounded-full bg-white/80 text-rose-500 font-semibold py-3 border border-rose-200 active:scale-95 transition"
              >
                おともだちを かえる
              </Link>
            </>
          ) : (
            <>
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 shadow-inner flex items-center justify-center text-5xl">
                ☁️
              </div>
              <p className="mt-6 text-base text-slate-600 text-center">
                さいしょに、おしゃべりするおともだちを えらんでね
              </p>
              <Link
                href="/select"
                className="mt-6 w-full text-center rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-4 shadow-lg active:scale-95 transition"
              >
                はじめる
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-white/70 backdrop-blur p-4 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">おうちの人へ</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {parentPinHash
                  ? "きょうの ようすを みられます"
                  : "PIN を きめて メモを みられるようにしよう"}
              </p>
            </div>
            <Link
              href="/parent"
              className="text-sm font-semibold text-rose-500 underline"
            >
              ひらく →
            </Link>
          </div>
          {sessions.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                これまでの おしゃべり: {sessions.length} かい
              </p>
              <Link href="/memo" className="text-[11px] text-rose-400 underline">
                メモをみる →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 初回年齢入力モーダル */}
      {showAgeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
            <p className="text-xl font-black text-slate-700 text-center">
              なんさいですか？
            </p>
            <p className="mt-2 text-sm text-slate-500 text-center">
              年れいによって言葉がかわるよ
            </p>
            <input
              type="number"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyAge()}
              placeholder="例: 7"
              min={1}
              max={18}
              autoFocus
              className="mt-5 w-full text-center text-3xl font-bold rounded-2xl border-2 border-rose-200 focus:border-rose-400 outline-none py-4 text-slate-700"
            />
            <button
              onClick={applyAge}
              className="mt-4 w-full rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-4 shadow-lg active:scale-95 transition text-lg"
            >
              決定！
            </button>
            <button
              onClick={skipAge}
              className="mt-2 w-full text-center text-sm text-slate-400 py-2"
            >
              あとでいれる
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes buddyBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
      `}</style>
    </main>
  );
}
