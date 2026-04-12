import { useEffect } from 'react';

interface GiftBurstProps {
  id: number;
  icon: string;
  onDone: (id: number) => void;
}

export default function GiftBurst({ id, icon, onDone }: GiftBurstProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone(id);
    }, 2200);

    return () => clearTimeout(timer);
  }, [id, onDone]);

  const left = 35 + Math.random() * 30;
  const size = 42 + Math.random() * 22;
  const duration = 1.8 + Math.random() * 0.8;
  const rotate = -18 + Math.random() * 36;

  return (
    <div
      className="pointer-events-none fixed bottom-24 z-[100] animate-gift-float select-none"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotate}deg)`,
        textShadow: '0 0 18px rgba(255,255,255,0.35)',
      }}
    >
      {icon}
    </div>
  );
}