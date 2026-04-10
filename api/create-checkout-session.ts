import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Utilizador não recebido' });
    }

    let price = 0;
    let name = '';
    let expiresAt = '';

    if (planId === 'pro') {
      price = 4999;
      name = 'Plano Pro';
    } else if (planId === 'premium') {
      price = 9999;
      name = 'Plano Premium';
    } else {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: 'https://topmusic-three.vercel.app?success=true',
      cancel_url: 'https://topmusic-three.vercel.app?cancel=true',
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor',
    });
  }
}