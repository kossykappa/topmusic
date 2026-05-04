import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface Message {
  id: string;
  sender_type: 'fan' | 'artist';
  message: string;
  created_at: string;
  read_at?: string | null;
}

interface ChatProps {
  artistId: string;
  fanUserId?: string;
}

export default function Chat({ artistId, fanUserId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = getUserId();
  const activeFanUserId = fanUserId || currentUserId;
  const conversationId = `${activeFanUserId}_${artistId}`;

  useEffect(() => {
    fetchMessages();

    supabase
      .from('artist_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'fan')
      .is('read_at', null);

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artist_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
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
      .from('artist_messages')
      .select('*')
      .eq('fan_user_id', activeFanUserId)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar chat:', error);
      return;
    }

    setMessages((data || []) as Message[]);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    const { error } = await supabase.from('artist_messages').insert({
      conversation_id: conversationId,
      fan_user_id: activeFanUserId,
      artist_id: artistId,
      sender_type: fanUserId ? 'artist' : 'fan',
      message: text.trim(),
      coins_paid: fanUserId ? 0 : 5,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setText('');
    fetchMessages();
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
              msg.sender_type === 'fan'
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

              {msg.sender_type === 'fan' && (
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
            className="rounded-full bg-purple-600 px-5 py-3 font-bold text-white"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}