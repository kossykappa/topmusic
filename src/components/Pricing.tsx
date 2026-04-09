import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
  color: string;
  border: string;
  popular?: boolean;
  popularLabel?: string;
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
      alert('Plano Premium ainda será ligado ao checkout.');
      return;
    }

    try {
      setLoadingPlan(planId);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
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
      border: 'border-gray-600',
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
      popular: true,
      popularLabel: t('pricing.pro.popular'),
    },
    {
      id: 'premium',
      name: t('pricing.premium.name'),
      price: t('pricing.premium.price'),
      period: t('pricing.premium.period'),
      cta: t('pricing.premium.cta'),
      features: t('pricing.premium.features', { returnObjects: true }) as string[],
      color: 'from-purple-600 to-pink-600',
      border: 'border-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('pricing.title')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('pricing.titleHighlight')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border ${plan.border} ${
                plan.popular ? 'border-2 transform scale-105' : ''
              }`}
            >
              {plan.popular && plan.popularLabel && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 rtl:translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.popularLabel}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2 rtl:ml-0 rtl:mr-2">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg shadow-red-500/50`
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {loadingPlan === plan.id ? 'A processar...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}