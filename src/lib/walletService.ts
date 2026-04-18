import { supabase } from './supabase';

const COIN_TO_USD = 0.01; // 100 coins = 1 USD

export async function ensureWallet(userId: string) {
  const { data: existingWallet, error: fetchError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Erro ao procurar wallet:', fetchError);
    return null;
  }

  if (existingWallet) return existingWallet;

  const { data: newWallet, error: insertError } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      coins: 0,
      balance_usd: 0,
      total_earned_usd: 0,
      total_withdrawn_usd: 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Erro ao criar wallet:', insertError);
    return null;
  }

  return newWallet;
}

export async function addCoinsToWallet(userId: string, coinsToAdd: number) {
  const wallet = await ensureWallet(userId);
  if (!wallet) return false;

  const nextCoins = Number(wallet.coins || 0) + coinsToAdd;

  const { error } = await supabase
    .from('wallets')
    .update({
      coins: nextCoins,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao actualizar wallet:', error);
    return false;
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'coin_reward',
    coins: coinsToAdd,
    amount_usd: 0,
    reference: 'reward',
  });

  return true;
}

export async function convertCoinsToUsd(userId: string, coinsToConvert: number) {
  const wallet = await ensureWallet(userId);
  if (!wallet) return { ok: false, message: 'Wallet não encontrada.' };

  const currentCoins = Number(wallet.coins || 0);

  if (coinsToConvert > currentCoins) {
    return { ok: false, message: 'Coins insuficientes.' };
  }

  if (coinsToConvert <= 0) {
    return { ok: false, message: 'Valor inválido.' };
  }

  const amountUsd = coinsToConvert * COIN_TO_USD;
  const nextCoins = currentCoins - coinsToConvert;
  const nextBalanceUsd = Number(wallet.balance_usd || 0) + amountUsd;
  const nextTotalEarnedUsd = Number(wallet.total_earned_usd || 0) + amountUsd;

  const { error } = await supabase
    .from('wallets')
    .update({
      coins: nextCoins,
      balance_usd: nextBalanceUsd,
      total_earned_usd: nextTotalEarnedUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao converter coins:', error);
    return { ok: false, message: 'Falha ao converter.' };
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'convert',
    coins: coinsToConvert,
    amount_usd: amountUsd,
    reference: 'coins_to_usd',
  });

  return { ok: true, message: `Conversão feita: $${amountUsd.toFixed(2)}` };
}

export async function sendGiftToArtist(
  fromUser: string,
  artistId: string,
  trackId: string,
  coins: number
) {
  const wallet = await ensureWallet(fromUser);
  if (!wallet) return { ok: false, message: 'Wallet não encontrada.' };

  const currentCoins = Number(wallet.coins || 0);

  if (coins > currentCoins) {
    return { ok: false, message: 'Sem coins suficientes.' };
  }

  const amountUsd = coins * COIN_TO_USD;
  const artistShareUsd = amountUsd * 0.7;

  const { error: walletError } = await supabase
    .from('wallets')
    .update({
      coins: currentCoins - coins,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', fromUser);

  if (walletError) {
    console.error('Erro ao debitar wallet do fã:', walletError);
    return { ok: false, message: 'Falha ao enviar gift.' };
  }

  await supabase.from('gifts').insert({
    from_user: fromUser,
    to_artist: artistId,
    track_id: trackId,
    coins,
    amount_usd: amountUsd,
  });

  await supabase.from('earnings').insert({
    artist_id: artistId,
    amount_usd: artistShareUsd,
    source: 'gift',
  });

  await supabase.from('transactions').insert({
    user_id: fromUser,
    type: 'gift',
    coins: -coins,
    amount_usd: amountUsd,
    reference: `gift:${trackId}`,
  });

  return { ok: true, message: 'Gift enviado com sucesso.' };
}

export async function requestWithdraw(
  userId: string,
  amountUsd: number,
  method: string,
  accountEmail: string,
  accountName: string,
  notes?: string
) {
  const wallet = await ensureWallet(userId);
  if (!wallet) return { ok: false, message: 'Wallet não encontrada.' };

  const currentBalance = Number(wallet.balance_usd || 0);

  if (amountUsd > currentBalance) {
    return { ok: false, message: 'Saldo insuficiente.' };
  }

  if (amountUsd <= 0) {
    return { ok: false, message: 'Valor inválido.' };
  }

  const { error: requestError } = await supabase
    .from('withdraw_requests')
    .insert({
      user_id: userId,
      amount_usd: amountUsd,
      status: 'pending',
      method,
      account_email: accountEmail,
      account_name: accountName,
      notes: notes || null,
    });

  if (requestError) {
    console.error('Erro ao criar pedido de levantamento:', requestError);
    return { ok: false, message: 'Falha ao criar pedido.' };
  }

  const { error: walletError } = await supabase
    .from('wallets')
    .update({
      balance_usd: currentBalance - amountUsd,
      total_withdrawn_usd: Number(wallet.total_withdrawn_usd || 0) + amountUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (walletError) {
    console.error('Erro ao actualizar wallet após levantamento:', walletError);
    return { ok: false, message: 'Pedido criado, mas saldo não actualizado.' };
  }

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'withdraw_request',
    coins: 0,
    amount_usd: amountUsd,
    reference: 'withdraw',
  });

  return { ok: true, message: 'Pedido de levantamento enviado.' };
}