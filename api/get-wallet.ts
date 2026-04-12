import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId em falta' });
    }

    const { data, error } = await supabase
      .from('wallets')
      .select('user_id, balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Wallet não encontrada' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}