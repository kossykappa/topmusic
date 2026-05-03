import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface Message {
  id: string;
  sender_type: 'fan' | 'artist';
  message: string;
  created_at: string;
}

interface ChatProps {
  artistId: string;
}

export default function Chat({ artistId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const userId = getUserId();
  const conversationId = `${userId}_${artistId}`;

  useEffect(() => {
  fetchMessages();

  const channel = supabase
    .channel(`chat-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    const { error } = await supabase.rpc('send_paid_chat_message', {
      p_fan_user_id: userId,
      p_artist_id: artistId,
      p_message: text,
      p_cost: 5,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setText('');
    fetchMessages();
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-3">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl max-w-[80%] ${
              msg.sender_type === 'fan'
                ? 'bg-purple-500 self-end'
                : 'bg-gray-700 self-start'
            }`}
          >
            {msg.message}
          </div>
        ))}

        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-black border border-white/10 px-4 py-2 rounded-xl"
            placeholder="Escreve mensagem..."
          />

          <button
            onClick={sendMessage}
            className="bg-purple-500 px-4 py-2 rounded-xl font-bold"
          >
            Enviar (5 coins)
          </button>
        </div>

      </div>
    </div>
  );
}