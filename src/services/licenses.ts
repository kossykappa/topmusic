import { supabase } from '../lib/supabase'

export async function buyLicense(userId: string, licenseId: string) {
  const { data: license, error } = await supabase
    .from('track_licenses')
    .select('*')
    .eq('id', licenseId)
    .single()

  if (error || !license) {
    console.error('Erro ao buscar licença')
    return
  }

  let expiresAt: string | null = null
  const now = new Date()

  if (license.duration_type === '24h') {
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }

  if (license.duration_type === '7d') {
    expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  await supabase.from('user_licenses').insert({
    user_id: userId,
    track_id: license.track_id,
    license_id: license.id,
    expires_at: expiresAt
  })

  await supabase.from('transactions').insert({
    user_id: userId,
    amount: license.price,
    type: 'license_purchase',
    status: 'completed'
  })

  console.log('Licença comprada com sucesso')
}