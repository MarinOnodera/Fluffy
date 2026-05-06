"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { BuddyCharacter } from "@/lib/types";

export type VoiceState = "idle" | "listening" | "speaking";

interface Props {
  character: BuddyCharacter;
  state: VoiceState;
  size?: number;
}

// 2〜4秒ごとにランダムで瞬き
function useBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    function schedule() {
      t = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 130);
      }, 2000 + Math.random() * 2200);
    }
    schedule();
    return () => clearTimeout(t);
  }, []);
  return blinking;
}

// 話しているとき口の開閉をトグル
function useMouthOpen(speaking: boolean) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!speaking) { setOpen(false); return; }
    const t = setInterval(() => setOpen((v) => !v), 160);
    return () => clearInterval(t);
  }, [speaking]);
  return open;
}

export function VoiceAvatar({ character, state, size = 280 }: Props) {
  const blinking = useBlink();
  const mouthOpen = useMouthOpen(state === "speaking");

  // 体のアニメーション
  const bodyAnim =
    state === "speaking" ? "voice-speak" :
    state === "listening" ? "voice-listen" :
    "voice-idle";

  // 口の縦サイズ: 開 → size*0.11, 閉 → size*0.03
  const mouthH = mouthOpen ? size * 0.11 : size * 0.03;
  // 口の横幅
  const mouthW = size * 0.22;

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
    >
      {/* 体アニメーション layer */}
      <div
        className="w-full h-full"
        style={{ animation: `${bodyAnim} ${state === "speaking" ? "0.55s" : state === "listening" ? "1.6s" : "2.8s"} ease-in-out infinite` }}
      >
        {/* 瞬きlayer (scaleYだけ担当) */}
        <div
          className="w-full h-full rounded-full overflow-hidden shadow-2xl"
          style={{
            transform: blinking ? "scaleY(0.91)" : "scaleY(1)",
            transition: blinking ? "transform 0.05s" : "transform 0.06s",
            transformOrigin: "center center",
          }}
        >
          <Image
            src={character.imageSrc}
            alt={character.name}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* 口オーバーレイ — 顔の下部 中央あたり */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: "57%",
            width: mouthW,
            height: mouthH,
            background: `${character.accent}cc`,
            transition: "height 0.08s ease",
            boxShadow: mouthOpen ? `0 2px 8px ${character.accent}88` : "none",
          }}
        />
      </div>

      {/* 聞いているとき: 下部にパルスドット */}
      {state === "listening" && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: character.accent,
                animation: `listenDot 0.9s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
