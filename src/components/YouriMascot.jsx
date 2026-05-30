const YouriMascot = ({ isXD = false, className = "w-32 h-32" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Latar/Bayangan */}
      <circle cx="50" cy="50" r="45" fill="#f4e1d2" />

      {/* Topi Koki */}
      <path
        d="M 20 40 Q 20 20 40 25 Q 50 10 60 25 Q 80 20 80 40 Q 90 50 80 60 L 20 60 Q 10 50 20 40 Z"
        fill="#ffffff"
        stroke="#d1bfae"
        strokeWidth="2"
      />

      {/* Rambut Cokelat */}
      <path
        d="M 25 45 Q 50 35 75 45 Q 80 60 70 65 Q 50 70 30 65 Q 20 60 25 45 Z"
        fill="#6b4423"
      />
      <path
        d="M 30 45 L 35 55 L 45 45 L 55 58 L 65 45"
        fill="none"
        stroke="#6b4423"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Wajah */}
      <path d="M 30 50 Q 50 85 70 50 Z" fill="#ffe0bd" />

      {/* Ekspresi Wajah Dinamis */}
      {!isXD ? (
        // Ekspresi Normal (Senyum)
        <g>
          {/* Mata */}
          <circle cx="42" cy="58" r="3" fill="#333" />
          <circle cx="58" cy="58" r="3" fill="#333" />
          {/* Rona Pipi */}
          <ellipse cx="36" cy="62" rx="4" ry="2" fill="#ffb3b3" opacity="0.6" />
          <ellipse cx="64" cy="62" rx="4" ry="2" fill="#ffb3b3" opacity="0.6" />
          {/* Mulut Senyum */}
          <path
            d="M 45 65 Q 50 70 55 65"
            fill="none"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ) : (
        // Ekspresi XD
        <g>
          {/* Mata >< */}
          <path
            d="M 38 54 L 44 58 L 38 62"
            fill="none"
            stroke="#333"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M 62 54 L 56 58 L 62 62"
            fill="none"
            stroke="#333"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Rona Pipi */}
          <ellipse cx="35" cy="62" rx="4" ry="2" fill="#ffb3b3" opacity="0.8" />
          <ellipse cx="65" cy="62" rx="4" ry="2" fill="#ffb3b3" opacity="0.8" />
          {/* Mulut D */}
          <path
            d="M 45 65 L 55 65 Q 50 75 45 65 Z"
            fill="#ff9999"
            stroke="#333"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
};

export default YouriMascot;
