import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao procurar wallet:', fetchError);
      return res.status(500).json({ error: 'Erro ao procurar wallet' });
    }

    if (wallet) {
      return res.status(200).json(wallet);
    }

    const { data: newWallet, error: insertError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        coins: 0,
        balance_usd: 0,
        total_earned_usd: 0,
        total_withdrawn_usd: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar wallet:', insertError);
      return res.status(500).json({ error: 'Erro ao criar wallet' });
    }

    return res.status(200).json(newWallet);
  } catch (err) {
    console.error('Erro interno get-wallet:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}