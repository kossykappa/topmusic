import { X, HelpCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CoinPack {
  coins: number;
  price: string;
}

interface LiveCoinsRechargeProps {
  open: boolean;
  currentCoins: number;
  onClose: () => void;
  onSelectPack: (coins: number) => void;
}

const coinPacks: CoinPack[] = [
  { coins: 5, price: '€0,08' },
  { coins: 20, price: '€0,30' },
  { coins: 60, price: '€0,89' },
  { coins: 490, price: '€7,15' },
  { coins: 630, price: '€9,20' },
  { coins: 840, price: '€12,29' },
  { coins: 1050, price: '€15,35' },
  { coins: 5250, price: '€76,59' },
];

export default function LiveCoinsRecharge({
  open,
  currentCoins,
  onClose,
  onSelectPack,
}: LiveCoinsRechargeProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/55 backdrop-blur-[2px]">
      <div className="max-h-[82vh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-5 text-black shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5"
          >
            <X size={22} />
          </button>

          <h2 className="text-xl font-black">
            {t('recharge')}
          </h2>

          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
            <HelpCircle size={24} />
          </button>
        </div>

        <div className="mb-5 text-lg font-bold">
          {t('balance')}:{' '}
          <span className="text-yellow-500">
            🪙 {currentCoins}
          </span>
        </div>

        <button className="mb-5 flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-4 text-left shadow-sm">
          <div>
            <div className="text-lg font-black">
              {t('exchange')}
            </div>

            <div className="text-sm text-black/45">
              {t('convertRewardsToCoins')}
            </div>
          </div>

          <ChevronRight size={24} />
        </button>

        <div className="grid grid-cols-3 gap-3">
          {coinPacks.map((pack) => (
            <button
              key={pack.coins}
              onClick={() =>
                onSelectPack(pack.coins)
              }
              className="rounded-2xl border border-black/10 bg-white px-3 py-4 text-center shadow-sm active:scale-95"
            >
              <div className="text-2xl font-black">
                🪙 {pack.coins}
              </div>

              <div className="mt-1 text-sm font-semibold text-black/45">
                {pack.price}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            onSelectPack(630)
          }
          className="mt-8 w-full rounded-full bg-pink-600 py-4 text-lg font-black text-white shadow-xl"
        >
          {t('recharge')}
        </button>
      </div>
    </div>
  );
}