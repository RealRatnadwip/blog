export function IconNotes({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#f5e6a3" stroke="#c4a84a" strokeWidth="1" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="#5a4a20" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFiles({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 6h7l2 2h9v12H4V6z" fill="#6eb5ff" stroke="#3a7bc8" strokeWidth="1" />
      <path d="M4 6h7v4H4V6z" fill="#9ed0ff" />
    </svg>
  );
}

export function IconTerminal({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#1a1a1a" stroke="#555" strokeWidth="1" />
      <path d="M6 10l3 2-3 2" stroke="#87bf4e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14h5" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3" fill="#bbb" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAbout({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#87bf4e" stroke="#6a9e3a" strokeWidth="1" />
      <path d="M12 8v1M12 11v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMintLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#87bf4e" />
      <path d="M8 14c2 2 6 2 8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
