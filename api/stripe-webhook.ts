import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable: any) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId || null;
      const planId = session.metadata?.planId || 'unknown';

      const amount = session.amount_total || 0;
      const currency = session.currency || 'brl';
      const customerEmail = session.customer_details?.email || null;
      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null;

      const { error } = await supabase.from('payments').insert({
        user_id: userId,
        plan_id: planId,
        amount,
        currency,
        status: 'paid',
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntent,
        customer_email: customerEmail,
      });

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Erro ao gravar pagamento' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}