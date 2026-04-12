import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, error } = await supabase
    .from('gift_catalog')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}