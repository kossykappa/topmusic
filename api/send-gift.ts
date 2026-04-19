import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const ARTIST_SHARE_PERCENT = 0.7;
const PLATFORM_SHARE_PERCENT = 0.3;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromUserId, toArtistId, trackId, giftCatalogId } = req.body || {};

    if (!fromUserId || !toArtistId || !giftCatalogId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (String(fromUserId) === String(toArtistId)) {
      return res.status(400).json({
        success: false,
        error: 'Não podes enviar presente para ti mesmo',
      });
    }

    // 1. Buscar gift no catálogo
    const { data: gift, error: giftError } = await supabase
      .from('gift_catalog')
      .select('*')
      .eq('id', giftCatalogId)
      .eq('is_active', true)
      .maybeSingle();

    if (giftError || !gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift não encontrado',
      });
    }

    const giftCoins = Number(gift.coin_value || 0);

    if (giftCoins <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Gift inválido',
      });
    }

    // 2. Buscar wallet do fã
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', fromUserId)
      .maybeSingle();

    if (senderWalletError || !senderWallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet do utilizador não encontrada',
      });
    }

    const senderCoins = Number(senderWallet.coins || 0);

    if (senderCoins < giftCoins) {
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente',
        balance: senderCoins,
      });
    }

    // 3. Buscar ou criar wallet do artista
    const { data: artistWallet, error: artistWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', toArtistId)
      .maybeSingle();

    if (artistWalletError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao procurar wallet do artista',
      });
    }

    const artistCoinsEarned = Math.floor(giftCoins * ARTIST_SHARE_PERCENT);
    const platformCoins = giftCoins - artistCoinsEarned;

    // 4. Actualizar wallet do fã
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({
        coins: senderCoins - giftCoins,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', fromUserId);

    if (senderUpdateError) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao debitar wallet do fã',
      });
    }

    // 5. Actualizar ou criar wallet do artista
    if (!artistWallet) {
      const { error: artistInsertError } = await supabase
        .from('wallets')
        .insert({
          user_id: toArtistId,
          coins: artistCoinsEarned,
          balance_usd: 0,
          total_earned_usd: 0,
          total_withdrawn_usd: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (artistInsertError) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar wallet do artista',
        });
      }
    } else {
      const currentArtistCoins = Number(artistWallet.coins || 0);

      const { error: artistUpdateError } = await supabase
        .from('wallets')
        .update({
          coins: currentArtistCoins + artistCoinsEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', toArtistId);

      if (artistUpdateError) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao creditar wallet do artista',
        });
      }
    }

    // 6. Registar transacção do fã
    const senderReference = `gift_sent:${fromUserId}:${toArtistId}:${giftCatalogId}:${Date.now()}`;

    const { error: senderTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: fromUserId,
        type: 'gift_sent',
        coins: -giftCoins,
        amount_usd: 0,
        reference: senderReference,
        created_at: new Date().toISOString(),
      });

    if (senderTxError) {
      console.error('Erro ao registar transacção do fã:', senderTxError);
    }

    // 7. Registar transacção do artista
    const artistReference = `gift_received:${fromUserId}:${toArtistId}:${giftCatalogId}:${Date.now()}`;

    const { error: artistTxError } = await supabase
      .from('transactions')
      .insert({
        user_id: toArtistId,
        type: 'gift_received',
        coins: artistCoinsEarned,
        amount_usd: 0,
        reference: artistReference,
        created_at: new Date().toISOString(),
      });

    if (artistTxError) {
      console.error('Erro ao registar transacção do artista:', artistTxError);
    }

    // 8. Registar tabela específica de gifts enviados
    const { error: sentGiftError } = await supabase
      .from('sent_gifts')
      .insert({
        from_user_id: fromUserId,
        to_artist_id: toArtistId,
        track_id: trackId || null,
        gift_catalog_id: giftCatalogId,
        coin_value: giftCoins,
        artist_coin_value: artistCoinsEarned,
        platform_coin_value: platformCoins,
        created_at: new Date().toISOString(),
      });

    if (sentGiftError) {
      console.error('Erro ao registar sent_gifts:', sentGiftError);
    }

    return res.status(200).json({
      success: true,
      message: 'Presente enviado com sucesso',
      newBalance: senderCoins - giftCoins,
      artistEarned: artistCoinsEarned,
      platformRetained: platformCoins,
    });
  } catch (err: any) {
    console.error('send-gift error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error',
    });
  }
}