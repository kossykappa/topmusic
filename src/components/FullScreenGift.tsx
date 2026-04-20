import { useEffect } from 'react';

interface Props {
  icon: string;
  name: string;
  onClose: () => void;
}

export default function FullScreenGift({ icon, name, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // duração 3s

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/80 animate-fade-in">
      <div className="text-8xl animate-bounce">{icon}</div>

      <div className="mt-4 text-xl font-bold text-white">
        {name}
      </div>
    </div>
  );
}