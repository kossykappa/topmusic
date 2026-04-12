import { useState } from 'react';
import { Check, Sparkles, Coins, Radio, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUserId } from '../utils/userId';

interface Plan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
  color: string;
  border: string;
  description: string;
  badge?: string;
  popular?: boolean;
  popularLabel?: string;
  disabled?: boolean;
}

export default function Pricing() {
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(planId: 'free' | 'pro' | 'premium') {
    if (planId === 'free') {
      alert('Plano grátis seleccionado.');
      return;
    }

    if (planId === 'premium') {
      alert('Plano Premium estará disponível em breve.');
      return;
    }

    try {
      setLoadingPlan(planId);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: getUserId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }

      if (!data.url) {
        throw new Error('URL do checkout não recebida');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Erro ao iniciar pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  }

  const plans: Plan[] = [
    {
      id: 'free',
      name: t('pricing.free.name'),
      price: t('pricing.free.price'),
      period: t('pricing.free.period'),
      cta: t('pricing.free.cta'),
      features: t('pricing.free.features', { returnObjects: true }) as string[],
      color: 'from-gray-600 to-gray-700',
      border: 'border-gray-700',
      description: 'Ideal para começar a publicar e testar a plataforma.',
      badge: 'Starter',
    },
    {
      id: 'pro',
      name: t('pricing.pro.name'),
      price: t('pricing.pro.price'),
      period: t('pricing.pro.period'),
      cta: t('pricing.pro.cta'),
      features: t('pricing.pro.features', { returnObjects: true }) as string[],
      color: 'from-red-600 to-purple-600',
      border: 'border-red-500',
      description: 'Melhor opção para crescer, ganhar visibilidade e monetizar.',
      badge: 'Best for Growth',
      popular: true,
      popularLabel: t('pricing.pro.popular'),
    },
    {
      id: 'premium',
      name: t('pricing.premium.name'),
      price: t('pricing.premium.price'),
      period: t('pricing.premium.period'),
      cta: 'Coming soon',
      features: t('pricing.premium.features', { returnObjects: true }) as string[],
      color: 'from-purple-600 to-pink-600',
      border: 'border-purple-500',
      description: 'Para artistas e equipas que querem máxima presença e ferramentas avançadas.',
      badge: 'Advanced',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>Plans for artists who want to grow</span>
          </div>

          <h1 className="mb-4 text-4xl font-black text-white md:text-6xl">
            {t('pricing.title')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('pricing.titleHighlight')}
            </span>
          </h1>

          <p className="text-lg text-gray-400 md:text-xl">
            Escolha o plano certo para publicar, crescer, receber gifts e construir
            a tua carreira no TopMusic.
          </p>
        </div>

        {/* VALUE CARDS */}
        <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Radio className="mb-3 h-6 w-6 text-red-400" />
            <h3 className="font-bold text-white">Mais visibilidade</h3>
            <p className="mt-2 text-sm text-gray-400">
              Aumenta a tua presença no feed e melhora a descoberta do teu conteúdo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Coins className="mb-3 h-6 w-6 text-yellow-400" />
            <h3 className="font-bold text-white">Monetização social</h3>
            <p className="mt-2 text-sm text-gray-400">
              Recebe apoio dos fãs através de gifts, coins e interações ao vivo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Crown className="mb-3 h-6 w-6 text-purple-400" />
            <h3 className="font-bold text-white">Marca mais forte</h3>
            <p className="mt-2 text-sm text-gray-400">
              Constrói uma presença mais premium e profissional dentro da plataforma.
            </p>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 backdrop-blur-sm ${
                plan.border
              } ${plan.popular ? 'scale-105 border-2 shadow-2xl shadow-red-500/20' : ''} ${
                plan.disabled ? 'opacity-85' : ''
              }`}
            >
              {plan.popular && plan.popularLabel && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-red-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    {plan.popularLabel}
                  </span>
                </div>
              )}

              {plan.badge && (
                <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mb-5 text-sm text-gray-400">{plan.description}</p>

                <div className="flex items-end justify-center md:justify-start">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="ml-2 text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan === plan.id || plan.disabled}
                className={`w-full rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-red-500/40`
                    : plan.disabled
                    ? 'bg-white/10 text-gray-300'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {loadingPlan === plan.id ? 'A processar pagamento...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="mx-auto mt-16 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <h2 className="mb-3 text-3xl font-black text-white">
            Start building your music business
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-gray-400">
            Publica, cresce, interage com fãs e transforma apoio em receita dentro do
            ecossistema TopMusic.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => handleCheckout('pro')}
              className="rounded-full bg-gradient-to-r from-red-600 to-purple-600 px-8 py-4 font-bold text-white shadow-xl transition hover:scale-105"
            >
              Go Pro
            </button>

            <button
              onClick={() => handleCheckout('free')}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Start Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}