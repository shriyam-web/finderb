const CHAKRA_SPOKES = Array.from({ length: 24 }, (_, index) => index * 15);

/** Indian national flag — 3:2 ratio with Ashoka Chakra */
export default function IndianFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="30" height="6.6667" fill="#FF9933" />
      <rect y="6.6667" width="30" height="6.6666" fill="#FFFFFF" />
      <rect y="13.3333" width="30" height="6.6667" fill="#138808" />
      <circle cx="15" cy="10" r="3" fill="none" stroke="#000080" strokeWidth="0.3" />
      {CHAKRA_SPOKES.map((angle) => (
        <line
          key={angle}
          x1="15"
          y1="10"
          x2="15"
          y2="7.05"
          stroke="#000080"
          strokeWidth="0.22"
          transform={`rotate(${angle} 15 10)`}
        />
      ))}
      <circle cx="15" cy="10" r="0.45" fill="#000080" />
    </svg>
  );
}
