import React from 'react';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  className = ''
}) => {
  return <div className={`relative overflow-hidden bg-[#0A0A0A] ${className}`}>
      <style>{`
        @keyframes aurora-1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30%, 20%) scale(1.1); }
          66% { transform: translate(-20%, 40%) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes aurora-2 {
          0% { transform: translate(0, 0) scale(1.1); }
          33% { transform: translate(-30%, -20%) scale(0.9); }
          66% { transform: translate(20%, -40%) scale(1.2); }
          100% { transform: translate(0, 0) scale(1.1); }
        }
        @keyframes aurora-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20%, -30%) scale(1.3); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .aurora-blob {
          filter: blur(100px);
          opacity: 0.15;
          position: absolute;
          border-radius: 50%;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="aurora-blob w-[500px] h-[500px] bg-purple-600 top-[-10%] left-[-10%]" style={{
        animation: 'aurora-1 20s infinite ease-in-out'
      }} />
        <div className="aurora-blob w-[600px] h-[600px] bg-blue-600 bottom-[-20%] right-[-10%]" style={{
        animation: 'aurora-2 25s infinite ease-in-out'
      }} />
        <div className="aurora-blob w-[400px] h-[400px] bg-pink-500 top-[20%] right-[-5%]" style={{
        animation: 'aurora-3 18s infinite ease-in-out'
      }} />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>;
};
