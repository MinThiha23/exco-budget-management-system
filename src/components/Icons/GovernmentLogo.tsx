import React from 'react';

interface GovernmentLogoProps {
  className?: string;
  size?: number;
}

const GovernmentLogo: React.FC<GovernmentLogoProps> = ({ className = '', size = 16 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Red circle background */}
      <circle cx="50" cy="50" r="45" fill="#d32f2f" stroke="#000" strokeWidth="1"/>
      
      {/* Yellow shield with stripes */}
      <circle cx="50" cy="50" r="35" fill="#ffeb3b" stroke="#000" strokeWidth="1"/>
      
      {/* Red center circle */}
      <circle cx="50" cy="50" r="25" fill="#d32f2f" stroke="#000" strokeWidth="1"/>
      
      {/* Golden laurel wreaths on sides */}
      <path d="M15 50 Q20 40 25 50 Q30 60 25 70 Q20 80 15 70 Q10 60 15 50" fill="#ffd700" stroke="#000" strokeWidth="0.5"/>
      <path d="M85 50 Q80 40 75 50 Q70 60 75 70 Q80 80 85 70 Q90 60 85 50" fill="#ffd700" stroke="#000" strokeWidth="0.5"/>
      
      {/* White banner */}
      <rect x="30" y="75" width="40" height="8" fill="white" stroke="#000" strokeWidth="0.5"/>
      <text x="50" y="82" textAnchor="middle" fontFamily="Arial" fontSize="6" fontWeight="bold" fill="#000">KEDAH</text>
      
      {/* Green crescent moon below */}
      <path d="M50 85 Q45 90 40 85 Q45 80 50 85" fill="#4caf50" stroke="#000" strokeWidth="0.5"/>
      
      {/* Star in center */}
      <polygon 
        points="50,35 55,45 65,45 59,52 61,62 50,57 39,62 41,52 35,45 45,45" 
        fill="#ffeb3b" 
        stroke="#000" 
        strokeWidth="0.5"
      />
    </svg>
  );
};

export default GovernmentLogo;
