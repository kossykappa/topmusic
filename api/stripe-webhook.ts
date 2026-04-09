import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function ensureWallet(userId: string) {
  const { data: existing } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('wallets')
    .insert([{ user_id: userId, balance: 0 }])
    .select('id, balance')
    .single();

  if (error) throw error;
  return created;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const sig = req.headers['stripe-signature'];
    const rawBody = await getRawBody(req);

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const coins = Number(session.metadata?.coins || 0);
        const reference = session.id;

        if (userId && coins > 0) {
          const { data: existingTx } = await supabase
            .from('wallet_transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle();

          if (!existingTx) {
            const wallet = await ensureWallet(userId);

            const newBalance = (wallet.balance || 0) + coins;

            const { error: walletError } = await supabase
              .from('wallets')
              .update({ balance: newBalance })
              .eq('user_id', userId);

            if (walletError) throw walletError;

            const { error: txError } = await supabase
              .from('wallet_transactions')
              .insert([
                {
                  user_id: userId,
                  type: 'deposit',
                  amount: coins,
                  reference,
                  metadata: {
                    source: 'stripe_checkout',
                    session_id: session.id,
                    amount_total: session.amount_total,
                    currency: session.currency,
                  },
                },
              ]);

            if (txError) throw txError;
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}