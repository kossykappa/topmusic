import { useMemo, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Gift, GiftCategory, gifts } from '../data/gifts';

interface GiftPanelProps {
  open: boolean;
  coins: number;
  onClose: () => void;
  onBuyCoins?: () => void;
  onSendGift: (gift: Gift) => void;
}

const tabs: { label: string; value: GiftCategory }[] = [
  { label: 'Popular', value: 'popular' },
  { label: 'Music', value: 'music' },
  { label: 'VIP', value: 'vip' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Universe', value: 'universe' },
];

export default function GiftPanel({
  open,
  coins,
  onClose,
  onBuyCoins,
  onSendGift,
}: GiftPanelProps) {
  const [activeTab, setActiveTab] = useState<GiftCategory>('popular');

  const filteredGifts = useMemo(
    () => gifts.filter((gift) => gift.category === activeTab),
    [activeTab]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-neutral-950 text-white shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-base font-bold">Presentes</h2>
          <p className="text-xs text-white/50">Escolha um gift para enviar na live</p>
        </div>

        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === tab.value
                ? 'bg-pink-600 text-white'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[46vh] overflow-y-auto px-3 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {filteredGifts.map((gift) => {
            const disabled = coins < gift.price;

            return (
              <button
                key={gift.id}
                disabled={disabled}
                onClick={() => onSendGift(gift)}
                className={`rounded-2xl p-2 text-center transition ${
                  disabled
                    ? 'opacity-40'
                    : 'bg-white/5 hover:bg-white/10 active:scale-95'
                }`}
              >
                <div className="text-4xl leading-none">{gift.emoji}</div>
                <div className="mt-2 truncate text-xs font-semibold">{gift.name}</div>
                <div className="mt-1 text-xs font-bold text-yellow-400">
                  🪙 {gift.price}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <div className="text-sm">
          Saldo:{' '}
          <span className="font-bold text-yellow-400">{coins} coins</span>
        </div>

        <button
          onClick={onBuyCoins}
          className="flex items-center gap-1 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-black"
        >
          Comprar coins
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}