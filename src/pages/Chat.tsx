import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface Message {
  id: string;
  conversation_id: string;
  fan_user_id: string;
  artist_id: string;
  sender_type: 'fan' | 'artist';
  message: string;
  read_at: string | null;
  created_at: string;
}

interface ChatProps {
  artistId: string;
  fanUserId?: string;
}

export default function Chat({ artistId, fanUserId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [coinBalance, setCoinBalance] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = getUserId();
  const activeFanUserId = fanUserId || currentUserId;
  const conversationId = `${activeFanUserId}_${artistId}`;
  const viewerType: 'fan' | 'artist' = fanUserId ? 'artist' : 'fan';

  fetchCoinBalance();

  useEffect(() => {
    fetchMessages();
    markAsRead();

    const channel = supabase
      .channel(`topmusic-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topmusic_chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('topmusic_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar chat:', error);
      return;
    }

    setMessages((data || []) as Message[]);
  }

  async function markAsRead() {
    const otherSide = viewerType === 'artist' ? 'fan' : 'artist';

    await supabase
      .from('topmusic_chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_type', otherSide)
      .is('read_at', null);
  }

  async function fetchCoinBalance() {
  const { data } = await supabase
    .from('user_coin_wallets')
    .select('balance')
    .eq('user_id', activeFanUserId)
    .maybeSingle();

  setCoinBalance(data?.balance || 0);
}

  async function sendMessage() {
  const cleanText = text.trim();
  if (!cleanText) return;

  if (viewerType === 'fan' && coinBalance < 5) {
  alert('Coins insuficientes. Compra coins para enviar mensagem.');
  return;
}

  if (viewerType === 'fan') {
    const { error } = await supabase.rpc('send_paid_topmusic_message', {
      p_fan_user_id: activeFanUserId,
      p_artist_id: artistId,
      p_message: cleanText,
      p_cost: 5,
    });

    if (error) {
      alert(error.message);
      return;
    }
  } else {
    const { error } = await supabase.from('topmusic_chat_messages').insert({
      conversation_id: conversationId,
      fan_user_id: activeFanUserId,
      artist_id: artistId,
      sender_type: 'artist',
      message: cleanText,
    });

    if (error) {
      alert(error.message);
      return;
    }
  }

  setText('');
  fetchCoinBalance();
}

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="border-b border-white/10 bg-black/80 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold">Chat</h1>
          <p className="text-xs text-gray-400">Conversa VIP com artista</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow ${
              msg.sender_type === viewerType
                ? 'self-end rounded-br-sm bg-purple-600 text-white'
                : 'self-start rounded-bl-sm bg-white/10 text-white'
            }`}
          >
            <p>{msg.message}</p>
            <p className="mt-1 text-right text-[10px] text-white/50">
              {new Date(msg.created_at).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {msg.sender_type === viewerType && (
                <span className="ml-1">{msg.read_at ? '✔✔' : '✔'}</span>
              )}
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 bg-black/90 px-4 py-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white outline-none"
            placeholder="Escreve mensagem..."
          />

          <button
  onClick={sendMessage}
  disabled={viewerType === 'fan' && coinBalance < 5}
  className="rounded-full bg-purple-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  {viewerType === 'fan'
    ? coinBalance >= 5
      ? 'Enviar (5 coins)'
      : 'Sem coins'
    : 'Responder'}
</button>
        </div>
      </div>
    </div>
  );
}