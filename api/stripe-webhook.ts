import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = String(session.metadata?.userId || '');
      const coins = Number(session.metadata?.coins || 0);
      const sessionId = String(session.id || '');

      if (!userId || !coins || !sessionId) {
        return res.status(400).send('Invalid session metadata');
      }

      const { data: existingTx } = await supabase
        .from('transactions')
        .select('reference')
        .eq('reference', `stripe:${sessionId}`)
        .maybeSingle();

      if (!existingTx) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!wallet) {
          await supabase.from('wallets').insert({
            user_id: userId,
            coins,
            balance_usd: 0,
            total_earned_usd: 0,
            total_withdrawn_usd: 0,
            updated_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from('wallets')
            .update({
              coins: Number(wallet.coins || 0) + coins,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }

        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'deposit',
          coins,
          amount_usd: 0,
          reference: `stripe:${sessionId}`,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('stripe-webhooks error:', error);
    return res.status(400).send('Webhook error');
  }
}