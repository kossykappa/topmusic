import { useEffect, useState } from 'react';
import { Inbox, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ArtistMessage {
  id: string;
  fan_user_id: string;
  artist_id: string;
  message: string | null;
  coins_spent: number | null;
  created_at: string;
}

export default function ArtistInbox() {
  const [messages, setMessages] = useState<ArtistMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    } else {
      setMessages((data || []) as ArtistMessage[]);
    }

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
            Mensagens pagas enviadas por fãs VIP.
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
          <div className="space-y-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-purple-300">
                      Fã: {item.fan_user_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Artista: {item.artist_id}
                    </p>
                  </div>

                  <div className="text-sm text-yellow-400">
                    🪙 {item.coins_spent || 0} coins
                  </div>
                </div>

                <div className="rounded-2xl bg-black/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                    <MessageCircle className="h-4 w-4" />
                    {formatDate(item.created_at)}
                  </div>

                  <p className="text-gray-200">
                    {item.message || '(sem mensagem)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}