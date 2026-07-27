import React from 'react';

const LiquidBackground = ({ imageUrl }: { imageUrl?: string | null }) => (
  <div className="liquid-bg">
    {imageUrl ? (
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    ) : (
      <>
        <div className="liquid-gradient" />
        <div className="fluid-lines">
          {[...Array(8)].map((_, i) => (
            <div 
              key={`fluid-line-${i}`} 
              className="fluid-line" 
              style={{ 
                '--duration': `${Math.random() * 10 + 10}s`,
                '--y-start': `${Math.random() * 100}%`,
                '--y-end': `${Math.random() * 100}%`,
                '--opacity': Math.random() * 0.5 + 0.1,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              } as any} 
            />
          ))}
        </div>
      </>
    )}
    <div className="absolute inset-0 bg-black/60" />
  </div>
);

export default LiquidBackground;
