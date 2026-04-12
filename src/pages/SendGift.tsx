import GiftSelector from '../components/GiftSelector';

export default function SendGift() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Enviar Presente 🎁</h1>
      <p className="text-gray-400 mb-6">
        Escolha um presente para enviar ao artista
      </p>

      <GiftSelector />
    </div>
  );
}