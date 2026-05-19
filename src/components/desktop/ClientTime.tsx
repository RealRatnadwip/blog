"use client";

import { useEffect, useState } from "react";

export function ClientTime({
  iso,
  options,
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(new Date(iso).toLocaleString(undefined, options));
  }, [iso, options]);

  return <time dateTime={iso}>{text || "…"}</time>;
}
