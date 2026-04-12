import GiftSelector from '../components/GiftSelector';

export default function SendGift() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Enviar Presentes</h1>
        <p className="mb-8 text-gray-300">
          Escolha um presente e apoie o artista com moedas.
        </p>

        <GiftSelector toArtistId="artist1" />
      </div>
    </div>
  );
}