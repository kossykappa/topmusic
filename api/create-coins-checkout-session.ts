import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

const coinPacks: Record<string, { name: string; amount: number; coins: number }> = {
  coins_100: { name: '100 Coins', amount: 299, coins: 100 },
  coins_500: { name: '500 Coins', amount: 999, coins: 500 },
  coins_1000: { name: '1000 Coins', amount: 1799, coins: 1000 },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packId, userId } = req.body || {};

    if (!packId || !userId) {
      return res.status(400).json({ error: 'packId ou userId em falta' });
    }

    const pack = coinPacks[packId];

    if (!pack) {
      return res.status(400).json({ error: 'Pacote inválido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
            },
            unit_amount: pack.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: 'coins',
        coins: String(pack.coins),
        packId,
      },
      success_url: 'https://topmusic-three.vercel.app?coins_success=true',
      cancel_url: 'https://topmusic-three.vercel.app?coins_cancel=true',
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe coins error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}