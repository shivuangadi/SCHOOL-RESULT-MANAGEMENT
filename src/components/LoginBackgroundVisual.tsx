import React from 'react';

export const LoginBackgroundVisual: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 select-none">
      {/* Clean, Deep Teal/Royal Karnataka Blue Gradient featuring #1f82b7 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1f82b7] via-[#166d9c] to-[#0f172a]" />

      {/* Subtle modern geometric dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #1e40af 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Soft atmospheric radial glow highlights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};
