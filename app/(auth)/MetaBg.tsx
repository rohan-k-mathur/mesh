/* app/(auth)/MetaBg.tsx */
import "./meta-bg.css";

export default function MetaBg() {
  return (
    <svg
      className="meta-bg"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {/* --- gooey filter --- */}
      <defs>
        <filter id="goo" colorInterpolationFilters="sRGB">
          <feGaussianBlur
            stdDeviation="30"
            result="blur"
            {...{ in: "SourceGraphic" }}
          />
          <feColorMatrix
            type="matrix"
            in="blur"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 32 -10"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>

      {/* --- layer 1 : accent blobs --- */}
      <g filter="url(#goo)">
        <ellipse className="blob core" cx="50%" cy="50%"rx="50" ry="80" />
        
        <ellipse className="blob n1 " cx="50%" cy="50%" rx="90" ry="60" />
        <ellipse className="blob n2" cx="50%" cy="50%" rx="65" ry="100 " />
        <circle className="blob n3" cx="50%" cy="50%" r="40" />
      </g>

      {/* --- layer 2 : tinted halo (lighter colour, slower) --- */}
      
    </svg>
  );
}
