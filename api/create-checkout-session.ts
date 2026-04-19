import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const COIN_PACKS: Record<
  string,
  { coins: number; unitAmount: number; currency: string; name: string }
> = {
  starter: {
    coins: 500,
    unitAmount: 500, // 5.00 EUR/USD em centavos
    currency: 'eur',
    name: 'TopMusic Coins — Starter',
  },
  plus: {
    coins: 1200,
    unitAmount: 1000, // 10.00
    currency: 'eur',
    name: 'TopMusic Coins — Plus',
  },
  pro: {
    coins: 2500,
    unitAmount: 2000, // 20.00
    currency: 'eur',
    name: 'TopMusic Coins — Pro',
  },
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

    const pack = COIN_PACKS[String(packId)];

    if (!pack) {
      return res.status(400).json({ error: 'Invalid packId' });
    }

    const baseUrl = process.env.APP_BASE_URL;

    if (!baseUrl) {
      return res.status(500).json({ error: 'APP_BASE_URL is not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/wallet`,
      line_items: [
        {
          price_data: {
            currency: pack.currency,
            product_data: {
              name: pack.name,
              description: `${pack.coins} TopMusic Coins`,
            },
            unit_amount: pack.unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: String(userId),
        packId: String(packId),
        coins: String(pack.coins),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}