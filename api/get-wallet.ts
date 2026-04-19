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
    // 🔎 Verifica se já existe wallet
    let { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // ⚠️ Se não existir → cria automaticamente
    if (!wallet) {
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          coins: 0,
          balance_usd: 0,
          total_earned_usd: 0,
          total_withdrawn_usd: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error(insertError);
        return res.status(500).json({ error: 'Erro ao criar wallet' });
      }

      wallet = newWallet;
    }

    return res.status(200).json(wallet);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}