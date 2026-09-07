"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
        .catch((error) => console.warn("오프라인 기능 등록 실패:", error));
    }
  }, []);

  return null;
}
