import { CheckCircle2, Coins, ArrowRight } from 'lucide-react';

interface CheckoutSuccessProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function CheckoutSuccess({ onNavigate }: CheckoutSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-green-500/15 p-4 text-green-300">
            <CheckCircle2 className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-3xl font-black">Pagamento concluído</h1>

        <p className="mt-3 text-white/70">
          As tuas coins serão creditadas automaticamente após a confirmação do Stripe.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
          Se não vires as coins imediatamente, actualiza a Wallet dentro de alguns segundos.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => onNavigate?.('wallet')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold text-white"
          >
            <Coins className="h-4 w-4" />
            Ver Wallet
          </button>

          <button
            onClick={() => onNavigate?.('feed')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
          >
            Voltar ao Feed
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}