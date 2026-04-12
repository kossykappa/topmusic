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
        filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.6))',
      }}
    >
      <div className="relative flex flex-col items-center">
        <span className="animate-pulse">{icon}</span>

        {combo > 1 && (
          <span className="mt-1 rounded-full bg-gradient-to-r from-pink-500 to-red-600 px-3 py-1 text-xs font-bold text-white shadow-xl animate-bounce">
            🔥 x{combo}
          </span>
        )}
      </div>
    </div>
  );
}