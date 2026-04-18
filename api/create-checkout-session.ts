import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { packId } = req.body;

  const packs = {
    starter: { coins: 500, price: 500 },
    plus: { coins: 1100, price: 1000 },
    pro: { coins: 2300, price: 2000 },
  };

  const pack = packs[packId];

  if (!pack) {
    return res.status(400).json({ error: 'Invalid pack' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${pack.coins} TopMusic Coins`,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    success_url: 'https://teu-dominio.com/success',
    cancel_url: 'https://teu-dominio.com/cancel',
  });

  return res.status(200).json({ url: session.url });
}