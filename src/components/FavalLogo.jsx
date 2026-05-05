export default function FavalLogo({ height = 40 }) {
  return (
    <svg
      viewBox="0 0 270 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      style={{ color: '#C8271A', flexShrink: 0 }}
      aria-label="Faval Agencia"
    >
      <line x1="8" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M40,30 A16,16 0 0,0 72,30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="72" y1="30" x2="90" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline
        points="90,30 102,30 118,4 126,56 136,30 158,30"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="158" y1="30" x2="210" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <text
        x="215"
        y="37"
        fontFamily="'Space Mono', monospace"
        fontSize="14"
        fill="currentColor"
        fontWeight="700"
      >
        {'</>'}
      </text>
    </svg>
  )
}
