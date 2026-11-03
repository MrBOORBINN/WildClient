import React from 'react';

const LiquidBackground = ({ imageUrl }: { imageUrl?: string | null }) => (
  <div className="fixed inset-0 pointer-events-none z-0 bg-[#000000]">
    {imageUrl ? (
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-40"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    ) : (
      <div className="absolute inset-0 bg-[#000000]" />
    )}
  </div>
);

export default LiquidBackground;
