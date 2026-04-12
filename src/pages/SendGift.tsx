import GiftSelector from '../components/GiftSelector';

export default function SendGift() {
  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden">
      
      {/* 🎬 VIDEO BACKGROUND */}
      <div className="relative h-full w-full flex items-center justify-center">

        <video
          src="/video-demo.mp4" // coloca um vídeo aqui depois
          autoPlay
          loop
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/50" />

        {/* 🎤 INFO DO ARTISTA */}
        <div className="absolute bottom-10 left-6 z-10 max-w-sm">
          <h2 className="text-xl font-bold">🎤 Maya Zuda</h2>
          <p className="text-sm text-gray-300">
            Ao vivo agora — envia presentes 🔥
          </p>
        </div>

        {/* 🎯 BOTÕES LADO DIREITO (TikTok style) */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center space-y-5">
          
          <button className="bg-white/10 p-3 rounded-full hover:bg-white/20">
            ❤️
          </button>

          <button className="bg-white/10 p-3 rounded-full hover:bg-white/20">
            💬
          </button>

          <button className="bg-white/10 p-3 rounded-full hover:bg-white/20">
            🔗
          </button>

          {/* BOTÃO DE GIFT */}
          <button className="bg-gradient-to-r from-pink-500 to-red-600 p-4 rounded-full shadow-xl hover:scale-110 transition">
            🎁
          </button>
        </div>

        {/* 🎁 PAINEL DE GIFTS */}
        <div className="absolute right-4 bottom-0 z-30">
          <GiftSelector />
        </div>

      </div>
    </div>
  );
}