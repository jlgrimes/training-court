export function PlaymatBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-[#C9B99A] dark:text-[#3d4a5c]"
      viewBox="0 0 1200 900"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <g opacity="0.45" stroke="currentColor" strokeWidth="1.5">
        <rect x="70" y="180" width="70" height="98" rx="8" />
        <rect x="70" y="290" width="70" height="98" rx="8" />
        <rect x="70" y="400" width="70" height="98" rx="8" />
        <rect x="160" y="180" width="70" height="98" rx="8" />
        <rect x="160" y="290" width="70" height="98" rx="8" />
        <rect x="160" y="400" width="70" height="98" rx="8" />
        <rect x="430" y="360" width="150" height="210" rx="14" />
        <rect x="610" y="360" width="150" height="210" rx="14" />
        <rect x="380" y="620" width="110" height="150" rx="12" />
        <rect x="510" y="620" width="110" height="150" rx="12" />
        <rect x="640" y="620" width="110" height="150" rx="12" />
        <rect x="770" y="620" width="110" height="150" rx="12" />
        <circle cx="900" cy="320" r="150" />
        <circle cx="900" cy="320" r="42" />
        <line x1="900" y1="170" x2="900" y2="278" />
        <line x1="900" y1="362" x2="900" y2="470" />
      </g>
    </svg>
  );
}
