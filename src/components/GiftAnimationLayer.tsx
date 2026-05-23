import { useEffect } from 'react';
import { Gift } from '../data/gifts';
import { useTranslation } from 'react-i18next';

export interface ActiveGiftAnimation {
  id: number;
  senderName: string;
  gift: Gift;
  quantity: number;
}

interface GiftAnimationLayerProps {
  animations: ActiveGiftAnimation[];
  onRemove: (id: number) => void;
}

export default function GiftAnimationLayer({
  animations,
  onRemove,
}: GiftAnimationLayerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    animations.forEach((item) => {
      const duration = item.gift.tier === 'mega' ? 4200 : 2600;

      const timer = window.setTimeout(() => {
        onRemove(item.id);
      }, duration);

      return () => window.clearTimeout(timer);
    });
  }, [animations, onRemove]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {animations.map((item) =>
        item.gift.tier === 'mega' ? (
          <div
            key={item.id}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="animate-bounce text-center">
              <div className="text-8xl drop-shadow-2xl">{item.gift.emoji}</div>

              <div className="mt-4 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-6 py-3 text-xl font-black uppercase text-white shadow-2xl">
                {t('giftSentByUser', {
                  senderName: item.senderName,
                  giftName: item.gift.name,
                })}
              </div>

              <div className="mt-3 text-4xl font-black text-white">
                x{item.quantity}
              </div>
            </div>
          </div>
        ) : (
          <div
            key={item.id}
            className="absolute left-4 top-[42%] animate-pulse rounded-full bg-black/60 px-4 py-2 text-white backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.gift.emoji}</span>

              <div>
                <div className="text-sm font-bold">{item.senderName}</div>

                <div className="text-xs text-white/70">
                  {t('sentGiftName', { giftName: item.gift.name })}
                </div>
              </div>

              <span className="text-xl font-black">x{item.quantity}</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}