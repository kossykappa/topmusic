import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromUserId, toArtistId, trackId, giftCatalogId } = req.body || {};

    if (!fromUserId || !toArtistId || !giftCatalogId) {
      return res.status(400).json({ error: 'Dados obrigatórios em falta' });
    }

    const { data: giftItem, error: giftError } = await supabase
      .from('gift_catalog')
      .select('id, name, coin_value, is_active')
      .eq('id', giftCatalogId)
      .eq('is_active', true)
      .single();

    if (giftError || !giftItem) {
      return res.status(404).json({ error: 'Presente não encontrado' });
    }

    const { data: senderWallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', fromUserId)
      .single();

    if (walletError || !senderWallet) {
      return res.status(404).json({ error: 'Wallet do utilizador não encontrada' });
    }

    if ((senderWallet.balance || 0) < giftItem.coin_value) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const artistAmount = Math.floor(giftItem.coin_value * 0.7);
    const platformAmount = giftItem.coin_value - artistAmount;
    const newBalance = senderWallet.balance - giftItem.coin_value;

    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', fromUserId);

    if (updateWalletError) {
      return res.status(500).json({ error: 'Erro ao debitar wallet' });
    }

    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert([
        {
          user_id: fromUserId,
          type: 'gift_sent',
          amount: -giftItem.coin_value,
          reference: `gift_${giftCatalogId}`,
          metadata: {
            to_artist_id: toArtistId,
            track_id: trackId || null,
            gift_catalog_id: giftCatalogId,
            gift_name: giftItem.name,
          },
        },
      ]);

    if (txError) {
      return res.status(500).json({ error: 'Erro ao registar transação' });
    }

    const { error: giftInsertError } = await supabase
      .from('gifts')
      .insert([
        {
          from_user_id: fromUserId,
          to_artist_id: toArtistId,
          track_id: trackId || null,
          gift_catalog_id: giftCatalogId,
          coins: giftItem.coin_value,
          artist_amount: artistAmount,
          platform_amount: platformAmount,
        },
      ]);

    if (giftInsertError) {
      return res.status(500).json({ error: 'Erro ao registar presente' });
    }

    return res.status(200).json({
      success: true,
      message: 'Presente enviado com sucesso',
      newBalance,
      artistAmount,
      platformAmount,
    });
  } catch (error: any) {
    console.error('Send gift error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}