import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const COIN_PACKS: Record<string, { name: string; amountCents: number; coins: number }> = {
  starter: { name: '500 Coins', amountCents: 500, coins: 500 },
  plus: { name: '1100 Coins', amountCents: 1000, coins: 1100 },
  pro: { name: '2300 Coins', amountCents: 2000, coins: 2300 },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packId, userId } = req.body || {};

    if (!packId || !userId) {
      return res.status(400).json({ error: 'Missing packId or userId' });
    }

    const pack = COIN_PACKS[packId];
    if (!pack) {
      return res.status(400).json({ error: 'Invalid packId' });
    }

    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${baseUrl}/?coins=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?coins=cancelled`,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
              description: `${pack.coins} moedas TopMusic`,
            },
            unit_amount: pack.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packId,
        coins: String(pack.coins),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}