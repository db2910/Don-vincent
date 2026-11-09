export function Botanical({ className = "", variant = "branch" }: { className?: string; variant?: "branch" | "corner" }) {
  return <svg className={`botanical ${className}`} viewBox="0 0 160 220" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M43 211C59 165 80 104 115 15M62 157C34 146 25 123 24 105M77 119C104 114 125 96 133 77M91 81C69 75 65 54 65 39M107 38C127 40 141 26 145 11"/>
      <path d="M61 159C40 158 31 143 33 133C50 131 62 144 61 159ZM71 134C78 112 95 105 105 109C104 126 88 137 71 134ZM80 111C60 107 50 92 54 80C71 81 84 97 80 111ZM94 77C101 57 119 48 130 52C128 70 111 82 94 77ZM105 49C87 42 81 25 86 14C102 19 110 34 105 49ZM48 191C29 181 21 162 27 150C44 156 53 175 48 191ZM56 174C70 157 89 154 99 162C91 178 72 184 56 174ZM116 20C112 9 117 2 125 1C132 11 125 22 116 20Z"/>
      {variant === "corner" && <><path d="M40 197C74 201 106 193 147 178M91 195C94 178 103 167 115 168C118 184 105 195 91 195ZM116 187C122 199 135 203 143 198C140 185 127 181 116 187Z"/><circle cx="39" cy="100" r="9"/><path d="M39 91V109M30 100H48M33 94L45 106M33 106L45 94"/></>}
    </g>
  </svg>;
}
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`ornament-divider ${className}`} aria-hidden="true"><span/><svg width="45" height="22" viewBox="0 0 45 22" fill="none"><path d="M22.5 19V3M22.5 14C11 15 9 7 9 7C18 5 22.5 14 22.5 14ZM22.5 14C34 15 36 7 36 7C27 5 22.5 14 22.5 14ZM22.5 8C16-1 22.5 0 22.5 0C22.5 0 29-1 22.5 8Z" stroke="currentColor" strokeWidth=".8"/></svg><span/></div>;
}
export function Monogram({ className = "" }: { className?: string }) { return <span className={`monogram ${className}`} aria-label="S and D">S<span>&</span>D</span>; }
