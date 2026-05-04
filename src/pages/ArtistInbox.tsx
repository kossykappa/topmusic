import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ArtistMessage {
  id: string;
  conversation_id: string;
  fan_user_id: string;
  artist_id: string;
  sender_type: 'fan' | 'artist';
  message: string | null;
  coins_paid?: number | null;
  created_at: string;
  read_at?: string | null;
  unread_count?: number;
}

interface ArtistInboxProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function ArtistInbox({ onNavigate }: ArtistInboxProps) {
  const [messages, setMessages] = useState<ArtistMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchMessages();

  const channel = supabase
    .channel('inbox-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE', // 👈 IMPORTANTE
        schema: 'public',
        table: 'artist_messages',
      },
      () => {
        fetchMessages(); // 👈 atualiza automaticamente
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function fetchMessages() {
    setLoading(true);

    const { data, error } = await supabase
      .from('artist_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
      setLoading(false);
      return;
    }

    const grouped = new Map<string, ArtistMessage>();

    (data || []).forEach((msg: ArtistMessage) => {
      const current = grouped.get(msg.conversation_id);

      if (!current) {
        grouped.set(msg.conversation_id, {
          ...msg,
          unread_count: msg.sender_type === 'fan' && !msg.read_at ? 1 : 0,
        });
        return;
      }

      if (msg.sender_type === 'fan' && !msg.read_at) {
        current.unread_count = (current.unread_count || 0) + 1;
      }
    });

    setMessages(Array.from(grouped.values()));
    setLoading(false);
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar inbox...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <Inbox className="h-10 w-10 text-purple-400" />
            Inbox do Artista
          </h1>
          <p className="mt-3 text-gray-400">
            Conversas VIP com fãs.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="mb-6 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Actualizar
        </button>

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-gray-400">
            Ainda não existem mensagens.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => (
              <div
                key={item.conversation_id}
                onClick={() =>
                  onNavigate?.('chat', {
                    artistId: item.artist_id,
                    fanUserId: item.fan_user_id,
                  })
                }
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div>
                  <p className="font-bold text-white">
                    Fã: {item.fan_user_id}
                  </p>

                  <p className="text-sm text-gray-400">
                    {item.message || '(sem mensagem)'}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                {(item.unread_count || 0) > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {item.unread_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}