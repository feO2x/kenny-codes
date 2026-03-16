export default function GuidedCodingDiagram() {
  return (
    <svg viewBox="0 0 870 200" xmlns="http://www.w3.org/2000/svg" style={{maxWidth: '870px', width: '100%', margin: '1.5rem auto', display: 'block'}}>
      {/* Background */}
      <rect x="0" y="0" width="870" height="200" rx="8" fill="#D6D6D6" />

      {/* Phase boxes */}
      <rect x="30" y="135" width="200" height="50" fill="#0078D4" rx="4" />
      <text x="130" y="166" textAnchor="middle" fill="white" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="600">1. Planning Phase</text>

      <rect x="275" y="135" width="200" height="50" fill="#E88A00" rx="4" />
      <text x="375" y="166" textAnchor="middle" fill="white" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="600">2. Implementation Phase</text>

      <rect x="520" y="135" width="200" height="50" fill="#6B2FA0" rx="4" />
      <text x="620" y="166" textAnchor="middle" fill="white" fontFamily="Segoe UI, sans-serif" fontSize="15" fontWeight="600">3. Guiding Phase</text>

      {/* Done / PR box */}
      <rect x="765" y="140" width="80" height="40" fill="#107C10" rx="20" />
      <text x="805" y="166" textAnchor="middle" fill="white" fontFamily="Segoe UI, sans-serif" fontSize="14" fontWeight="600">✓ PR</text>

      {/* Forward arrows between phases */}
      <line x1="230" y1="160" x2="270" y2="160" stroke="#888" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
      <line x1="475" y1="160" x2="515" y2="160" stroke="#888" strokeWidth="2.5" markerEnd="url(#arrowGray)" />
      <line x1="720" y1="160" x2="760" y2="160" stroke="#888" strokeWidth="2.5" markerEnd="url(#arrowGray)" />

      {/* Arrow marker definitions */}
      <defs>
        <marker id="arrowGray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
        </marker>
      </defs>

      {/* Self-loop on Planning Phase (right side) */}
      <path d="M 205 135 V 115 Q 205 105, 195 105 H 175 Q 165 105, 165 115 V 122" fill="none" stroke="#0078D4" strokeWidth="7" />
      <polygon points="165,132 155,114 175,114" fill="#0078D4" />

      {/* Blue arrow: Guiding → Planning (large issue) */}
      <path d="M 660 135 V 50 Q 660 25, 635 25 H 155 Q 130 25, 130 50 V 100" fill="none" stroke="#0078D4" strokeWidth="11" />
      <polygon points="130,130 108,96 152,96" fill="#0078D4" />

      {/* Yellow arrow: Guiding → Implementation (small issue) */}
      <path d="M 595 135 V 100 Q 595 80, 575 80 H 395 Q 375 80, 375 100 V 108" fill="none" stroke="#E88A00" strokeWidth="10" />
      <polygon points="375,130 355,100 395,100" fill="#E88A00" />
    </svg>
  );
}
