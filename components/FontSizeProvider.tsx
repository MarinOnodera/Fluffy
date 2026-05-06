"use client";

import { useBuddy } from "@/lib/store";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const { fontSize } = useBuddy();
  const cls =
    fontSize === "sm" ? "text-sm" :
    fontSize === "lg" ? "text-lg" :
    "text-base";
  return <div className={cls}>{children}</div>;
}
