"use client";

import { useEffect, useState } from "react";

export function ClientClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      setDate(
        now.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mint-clock-widget">
      <span className="mint-clock-time">{time || "—:—"}</span>
      <span className="mint-clock-date">{date || "— —"}</span>
    </div>
  );
}

