"use client";

import { useEffect } from "react";
import { useBuddy } from "@/lib/store";

// html要素のfont-sizeを変えることで全rem単位のサイズが比例してスケールする
const SIZE_MAP = { sm: "14px", md: "16px", lg: "19px" } as const;

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { fontSize } = useBuddy();

  useEffect(() => {
    document.documentElement.style.fontSize = SIZE_MAP[fontSize];
  }, [fontSize]);

  return <>{children}</>;
}
