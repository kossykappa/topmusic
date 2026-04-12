import GiftSelector from '../components/GiftSelector';

export default function SendGift() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-2 text-4xl font-bold">Presentes ao Vivo</h1>
        <p className="mb-8 text-gray-400">
          Envie presentes para apoiar artistas e criar mais interação na plataforma.
        </p>

        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-purple-500/10" />

          <div className="relative z-10 text-center">
            <div className="mb-4 text-7xl">🎤</div>
            <h2 className="mb-2 text-2xl font-bold">Live Preview</h2>
            <p className="text-gray-300">
              Aqui o utilizador pode enviar presentes durante a música, live ou vídeo.
            </p>
          </div>

          <GiftSelector />
        </div>
      </div>
    </div>
  );
}