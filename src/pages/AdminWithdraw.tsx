import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminWithdraw() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    setRequests(data || []);
  }

  async function updateStatus(id: string, status: string) {
    await supabase
      .from('withdrawal_requests')
      .update({ status })
      .eq('id', id);

    fetchRequests();
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">Withdraw Requests</h1>

      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p><strong>Artist:</strong> {req.artist_id}</p>
            <p><strong>Amount:</strong> {req.amount} $</p>
            <p><strong>Method:</strong> {req.method}</p>
            <p><strong>Details:</strong> {req.account_details}</p>
            <p><strong>Status:</strong> {req.status}</p>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() => updateStatus(req.id, 'approved')}
                className="rounded-lg bg-green-500 px-4 py-2 font-bold text-black"
              >
                Approve
              </button>

              <button
                onClick={() => updateStatus(req.id, 'rejected')}
                className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}