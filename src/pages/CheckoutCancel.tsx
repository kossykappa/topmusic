import { XCircle, ArrowLeft, Coins } from 'lucide-react';

interface CheckoutCancelProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function CheckoutCancel({ onNavigate }: CheckoutCancelProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-500/15 p-4 text-red-300">
            <XCircle className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-3xl font-black">Pagamento cancelado</h1>

        <p className="mt-3 text-white/70">
          Nenhuma coins foi debitada. Podes tentar novamente quando quiseres.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => onNavigate?.('wallet')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold text-white"
          >
            <Coins className="h-4 w-4" />
            Voltar à Wallet
          </button>

          <button
            onClick={() => onNavigate?.('feed')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Feed
          </button>
        </div>
      </div>
    </div>
  );
}