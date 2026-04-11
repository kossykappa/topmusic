import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  const { data, error } = await supabase
    .from('gift_catalog')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar gifts' });
  }

  res.status(200).json(data);
}