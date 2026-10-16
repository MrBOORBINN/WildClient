import React, { useState, useEffect } from 'react';

export const GenerationTimer = ({ perfStartTime }: { perfStartTime: number }) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      setElapsedMs(performance.now() - perfStartTime);
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrameId);
  }, [perfStartTime]);

  return <span>{(elapsedMs / 1000).toFixed(2)}s</span>;
};
