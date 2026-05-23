import { useState } from 'react';
import { Coins, Sparkles, Gift, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getUserId } from '../utils/userId';
import { useTranslation } from 'react-i18next';

interface BuyCoinsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

interface CoinPack {
  id: string;
  nameKey: string;
  price: string;
  coinsKey: string;
  descriptionKey: string;
  badgeKey?: string;
  popular?: boolean;
}

const PACKS: CoinPack[] = [
  {
    id: 'starter',
    nameKey: 'starterPack',
    coinsKey: 'starterCoins',
    price: '€5',
    descriptionKey: 'starterPackDescription',
    badgeKey: 'entry',
  },
  {
    id: 'plus',
    nameKey: 'plusPack',
    coinsKey: 'plusCoins',
    price: '€10',
    descriptionKey: 'plusPackDescription',
    badgeKey: 'bestValue',
    popular: true,
  },
  {
    id: 'pro',
    nameKey: 'proPack',
    coinsKey: 'proCoins',
    price: '€20',
    descriptionKey: 'proPackDescription',
    badgeKey: 'powerSupport',
  },
];

export default function BuyCoins({ onNavigate }: BuyCoinsProps) {
  const { t } = useTranslation();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleBuy(packId: string) {
    setError('');
    setLoadingPack(packId);

    try {
      const userId = getUserId();

      const response = await fetch('/api/create-coins-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('paymentStartFailed'));
      }

      if (!data.url) {
        throw new Error(t('checkoutUrlMissing'));
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || t('paymentError'));
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span>{t('fuelArtistEconomy')}</span>
          </div>

          <Coins className="mx-auto mb-4 h-12 w-12 text-yellow-400" />

          <h1 className="mb-3 text-4xl font-black md:text-6xl">
            {t('buyCoins')}
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            {t('buyCoinsSubtitle')}
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Gift className="mb-3 h-6 w-6 text-pink-400" />
            <h3 className="font-bold text-white">{t('sendGifts')}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t('sendGiftsDescription')}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Coins className="mb-3 h-6 w-6 text-yellow-400" />
            <h3 className="font-bold text-white">{t('fastPurchase')}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t('fastPurchaseDescription')}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <CheckCircle2 className="mb-3 h-6 w-6 text-green-400" />
            <h3 className="font-bold text-white">{t('directSupport')}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t('directSupportDescription')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-3xl border bg-white/5 p-6 text-center backdrop-blur-sm ${
                pack.popular
                  ? 'scale-105 border-yellow-400/60 shadow-2xl shadow-yellow-500/10'
                  : 'border-white/10'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1 text-sm font-bold text-black">
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              {pack.badgeKey && (
                <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                  {t(pack.badgeKey)}
                </div>
              )}

              <h2 className="mb-2 text-2xl font-bold text-white">
                {t(pack.nameKey)}
              </h2>

              <p className="mb-3 text-lg font-semibold text-yellow-400">
                {t(pack.coinsKey)}
              </p>

              <p className="mb-5 text-sm text-gray-400">
                {t(pack.descriptionKey)}
              </p>

              <p className="mb-6 text-4xl font-extrabold text-white">
                {pack.price}
              </p>

              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loadingPack === pack.id}
                className={`w-full rounded-xl px-4 py-3 font-semibold transition hover:scale-105 disabled:opacity-50 ${
                  pack.popular
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loadingPack === pack.id ? t('processing') : t('buy')}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-red-300">
            {error}
          </div>
        )}

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <h2 className="mb-3 text-3xl font-black text-white">
            {t('readyToSupportArtists')}
          </h2>

          <p className="mx-auto mb-6 max-w-2xl text-gray-400">
            {t('readyToSupportArtistsText')}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate('sendGift')}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('backToGifts')}
              </span>
            </button>

            <button
              onClick={() => handleBuy('plus')}
              className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-bold text-black transition hover:scale-105"
            >
              {t('buyRecommendedPack')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}