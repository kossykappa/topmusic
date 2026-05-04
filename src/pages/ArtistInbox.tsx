import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InboxItem {
  id: string;
  conversation_id: string;
  fan_user_id: string;
  artist_id: string;
  sender_type: 'fan' | 'artist';
  message: string;
  read_at: string | null;
  created_at: string;
  unread_count: number;
}

interface ArtistInboxProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function ArtistInbox({ onNavigate }: ArtistInboxProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();

    const channel = supabase
      .channel('topmusic-inbox-final')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topmusic_chat_messages',
        },
        () => fetchInbox()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchInbox() {
    setLoading(true);

    const { data, error } = await supabase
      .from('topmusic_chat_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar inbox:', error);
      setItems([]);
      setLoading(false);
      return;
    }

    const grouped = new Map<string, InboxItem>();

    (data || []).forEach((msg) => {
      const existing = grouped.get(msg.conversation_id);

      if (!existing) {
        grouped.set(msg.conversation_id, {
          ...msg,
          unread_count:
            msg.sender_type === 'fan' && msg.read_at === null ? 1 : 0,
        });
      } else if (msg.sender_type === 'fan' && msg.read_at === null) {
        existing.unread_count += 1;
      }
    });

    setItems(Array.from(grouped.values()));
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

          <p className="mt-3 text-gray-400">Conversas VIP com fãs.</p>
        </div>

        <button
          onClick={fetchInbox}
          className="mb-6 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Actualizar
        </button>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-gray-400">
            Ainda não existem mensagens.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.conversation_id}
                onClick={() =>
                  onNavigate?.('chat', {
                    artistId: item.artist_id,
                    fanUserId: item.fan_user_id,
                  })
                }
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div>
                  <p className="font-bold text-white">
                    Fã: {item.fan_user_id}
                  </p>

                  <p className="mt-1 text-sm text-gray-300">
                    {item.message || '(sem mensagem)'}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                {item.unread_count > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {item.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}