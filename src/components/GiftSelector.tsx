import { useEffect, useState } from 'react';

export default function GiftSelector({ toArtistId }: any) {
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    fetch('/api/get-gifts')
      .then(res => res.json())
      .then(setGifts);
  }, []);

  async function sendGift(giftId: number) {
    const res = await fetch('/api/send-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: 'user1',
        toArtistId,
        giftCatalogId: giftId
      })
    });

    const data = await res.json();
    alert(data.message);
  }

  return (
    <div style={{ background: '#111', padding: 20 }}>
      <h3>Enviar Presente 🎁</h3>

      {gifts.map((gift: any) => (
        <button
          key={gift.id}
          onClick={() => sendGift(gift.id)}
          style={{
            margin: 10,
            padding: 10,
            borderRadius: 10,
            background: '#222',
            color: '#fff'
          }}
        >
          {gift.icon} {gift.name} — {gift.coin_value}
        </button>
      ))}
    </div>
  );
}