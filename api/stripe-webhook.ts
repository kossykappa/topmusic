if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId || null;
  const planId = session.metadata?.planId || null;
  const type = session.metadata?.type || 'plan';
  const coins = Number(session.metadata?.coins || 0);

  const amount = session.amount_total || 0;
  const currency = session.currency || 'eur';
  const customerEmail = session.customer_details?.email || null;
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : null;

  const { error: paymentError } = await supabase.from('payments').insert({
    user_id: userId,
    plan_id: planId || type,
    amount,
    currency,
    status: 'paid',
    stripe_session_id: session.id,
    stripe_payment_intent: paymentIntent,
    customer_email: customerEmail,
  });

  if (paymentError) {
    console.error('Supabase payment insert error:', paymentError);
    return res.status(500).json({ error: 'Erro ao gravar pagamento' });
  }

  if (type === 'coins' && userId && coins > 0) {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('user_id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet não encontrada' });
    }

    const newBalance = (wallet.balance || 0) + coins;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar wallet' });
    }

    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: coins,
        reference: session.id,
        metadata: {
          source: 'stripe',
          pack: session.metadata?.packId || null,
        },
      });

    if (txError) {
      return res.status(500).json({ error: 'Erro ao gravar transação da wallet' });
    }
  }
}