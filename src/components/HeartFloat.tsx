import { useEffect } from 'react';

interface HeartFloatProps {
  id: number;
  onDone: (id: number) => void;
}

export default function HeartFloat({ id, onDone }: HeartFloatProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDone(id);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [id, onDone]);

  const left = 78 + Math.random() * 8;
  const size = 20 + Math.random() * 18;
  const duration = 1.2 + Math.random() * 0.8;
  const rotate = -20 + Math.random() * 40;

  return (
    <div
      className="pointer-events-none fixed bottom-24 z-[130] animate-heart-float"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 0 10px rgba(255, 80, 120, 0.45))',
      }}
    >
      ❤️
    </div>
  );
}