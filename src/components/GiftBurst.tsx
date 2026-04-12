import { useEffect } from 'react';

interface GiftBurstProps {
  id: number;
  icon: string;
  combo?: number;
  onDone: (id: number) => void;
}

export default function GiftBurst({ id, icon, combo = 1, onDone }: GiftBurstProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone(id);
    }, 2400);

    return () => clearTimeout(timer);
  }, [id, onDone]);

  const left = 62 + Math.random() * 14;
  const size = 42 + Math.random() * 18;
  const duration = 1.8 + Math.random() * 0.7;
  const rotate = -12 + Math.random() * 24;

  return (
    <div
      className="pointer-events-none fixed bottom-28 z-[120] animate-gift-float select-none"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotate}deg)`,
        textShadow: '0 0 18px rgba(255,255,255,0.35)',
      }}
    >
      <div className="relative">
        <span>{icon}</span>
        {combo > 1 && (
          <span className="absolute -right-8 -top-2 rounded-full bg-pink-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
            x{combo}
          </span>
        )}
      </div>
    </div>
  );
}