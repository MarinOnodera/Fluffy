"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBuddy } from "@/lib/store";

const FONT_OPTIONS = [
  { value: "sm" as const, label: "小" },
  { value: "md" as const, label: "中" },
  { value: "lg" as const, label: "大" },
];

export default function SettingsPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    childName, setChildName,
    childAge, setChildAge,
    agePromptShown, setAgePromptShown,
    fontSize, setFontSize,
    familyCode,
  } = useBuddy();
  void agePromptShown;

  const [ageInput, setAgeInput] = useState(childAge ? String(childAge) : "");
  const [copied, setCopied] = useState(false);

  const viewUrl = typeof window !== "undefined"
    ? `${window.location.origin}/view/${familyCode}`
    : `/view/${familyCode}`;

  function shareFamily() {
    const text = `もこもこフレンドの記録はこちらから見られます:\n${viewUrl}`;
    if (navigator.share) {
      void navigator.share({ title: "もこもこフレンド", text, url: viewUrl });
    } else {
      void navigator.clipboard.writeText(viewUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function applyAge() {
    const n = parseInt(ageInput, 10);
    setChildAge(isNaN(n) || n <= 0 ? null : Math.min(n, 18));
    setAgePromptShown();
  }

  const ageLabel = childAge === null ? "未設定"
    : childAge < 6 ? "未就学児（全部ひらがな）"
    : childAge <= 8 ? "小学校低学年（やさしい漢字）"
    : childAge <= 11 ? "小学校高学年（ふつうの漢字）"
    : "中学生以上（通常）";

  if (!hydrated) return <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100" />;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-purple-50 text-slate-800">
      <div className="mx-auto max-w-md px-5 pt-8 pb-24">
        <Link href="/" className="text-sm text-rose-400">← もどる</Link>
        <h1 className="mt-3 text-2xl font-black text-rose-500">せってい ⚙️</h1>

        {/* 子どもの名前 */}
        <Section title="よびな">
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="例: ゆい / Yuki"
            maxLength={20}
            className="w-full rounded-xl bg-white border border-rose-100 px-4 py-3 outline-none focus:border-rose-300 text-slate-700"
          />
        </Section>

        {/* 年齢 */}
        <Section title="年れい">
          <div className="flex gap-2">
            <input
              type="number"
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              onBlur={applyAge}
              placeholder="例: 7"
              min={1}
              max={18}
              className="w-24 rounded-xl bg-white border border-rose-100 px-4 py-3 outline-none focus:border-rose-300 text-slate-700 text-center"
            />
            <button
              onClick={applyAge}
              className="rounded-full bg-rose-400 text-white font-bold px-5 py-2"
            >
              決定
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{ageLabel}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            年れいによってAIの言葉づかいが変わります
          </p>
        </Section>

        {/* 文字の大きさ */}
        <Section title="文字の大きさ">
          <div className="flex gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 py-3 rounded-2xl font-bold border transition ${
                  fontSize === opt.value
                    ? "bg-rose-400 text-white border-rose-400 shadow"
                    : "bg-white text-slate-600 border-rose-100"
                } ${opt.value === "sm" ? "text-sm" : opt.value === "lg" ? "text-xl" : "text-base"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* 家族コード・共有 */}
        <Section title="おうちの人と共有">
          <p className="text-xs text-slate-500 mb-3">
            このリンクを送ると、別のスマホからいつでも子どもの様子が確認できます。
            パスワード不要です。
          </p>
          <div className="rounded-xl bg-white border border-rose-100 px-4 py-3 text-xs text-slate-500 break-all mb-3">
            {viewUrl}
          </div>
          <p className="text-xs font-bold text-slate-600 mb-2">
            家族コード: <span className="text-rose-500 text-base tracking-widest">{familyCode}</span>
          </p>
          <button
            onClick={shareFamily}
            className="w-full rounded-full bg-gradient-to-r from-rose-400 to-pink-400 text-white font-bold py-3 shadow active:scale-95 transition"
          >
            {copied ? "コピーしました ✓" : "リンクを共有する ↗"}
          </button>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            コードを知っている人だけが見られます
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl bg-white/80 p-4 border border-white/60 shadow-sm">
      <p className="text-sm font-bold text-slate-700 mb-3">{title}</p>
      {children}
    </div>
  );
}
