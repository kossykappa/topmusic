import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYPAL_API =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    const requestRes = await fetch(
      `${supabaseUrl}/rest/v1/withdrawal_requests?id=eq.${requestId}&select=*`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    const requests = await requestRes.json();
    const withdrawal = requests?.[0];

    if (!withdrawal) {
  return res.status(404).json({ error: 'Withdrawal request not found' });
}

if (withdrawal.status === 'paid') {
  return res.status(400).json({ error: 'This request was already paid' });
}

if (withdrawal.status !== 'approved') {
  return res.status(400).json({ error: 'Request must be approved first' });
}



if (!withdrawal.account_details || !withdrawal.account_details.includes('@')) {
  return res.status(400).json({ error: 'Invalid PayPal email' });
}

    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenRes.json();

   if (!tokenRes.ok) {
  console.log('PAYPAL TOKEN ERROR:', tokenData);

  return res.status(500).json({
    error: 'PayPal token error',
    details: tokenData,
  });
}

    const payoutRes = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `topmusic-${requestId}`,
          email_subject: 'TopMusic payout',
          email_message: 'You received a payout from TopMusic.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: Number(withdrawal.amount).toFixed(2),
              currency: 'USD',
            },
            receiver: withdrawal.account_details,
            note: 'TopMusic artist payout',
            sender_item_id: requestId,
          },
        ],
      }),
    });

    const payoutData = await payoutRes.json();

    if (!payoutRes.ok) {
  console.log('PAYPAL PAYOUT ERROR:', payoutData);

  return res.status(500).json({
    error: 'PayPal payout error',
    details: payoutData,
  });
}

    const payoutBatchId = payoutData.batch_header?.payout_batch_id || null;

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/withdrawal_requests?id=eq.${requestId}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status: 'paid',
          payment_reference: payoutBatchId,
          paid_at: new Date().toISOString(),
        }),
      }
    );

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return res.status(500).json({
        error: 'DB update failed',
        details: updateData,
      });
    }

    return res.status(200).json({
      success: true,
      payoutBatchId,
      updated: updateData,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}