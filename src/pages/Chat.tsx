import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

const MESSAGE_COST = 1;
const CHAT_GIFTS = [
  { label: '❤️', cost: 2 },
  { label: '🔥', cost: 5 },
  { label: '💎', cost: 15 },
  { label: '👑', cost: 25 },
];

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
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function Chat({ artistId, fanUserId, onNavigate }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [coinBalance, setCoinBalance] = useState(0);
  const [giftAnimation, setGiftAnimation] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = getUserId();
  const activeFanUserId = fanUserId || currentUserId;
  const conversationId = `${activeFanUserId}_${artistId}`;
  const viewerType: 'fan' | 'artist' = fanUserId ? 'artist' : 'fan';

  useEffect(() => {
    fetchMessages();
    fetchCoinBalance();
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
          fetchCoinBalance();
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
    if (viewerType !== 'fan') return;

    const { data } = await supabase
      .from('user_coin_wallets')
      .select('balance')
      .eq('user_id', activeFanUserId)
      .maybeSingle();

    setCoinBalance(data?.balance || 0);
  }

  async function sendGift(label: string, cost: number) {
  if (viewerType !== 'fan') return;

  if (coinBalance < cost) {
    alert('Coins insuficientes para enviar este gift.');
    return;
  }

  const { error } = await supabase.rpc('send_topmusic_chat_gift', {
    p_fan_user_id: activeFanUserId,
    p_artist_id: artistId,
    p_gift_label: label,
    p_cost: cost,
  });

  if (error) {
    alert(error.message);
    return;
  }

  setGiftAnimation(label);

setTimeout(() => {
  setGiftAnimation(null);
}, 1200);

  await fetchCoinBalance();
  await fetchMessages();
}

  async function sendMessage() {
    const cleanText = text.trim();
    if (!cleanText) return;

    if (viewerType === 'fan' && coinBalance < MESSAGE_COST) {
      alert('Coins insuficientes. Compra coins para enviar mensagem.');
      return;
    }

    if (viewerType === 'fan') {
      const { error: spendError } = await supabase.rpc('spend_user_coins', {
        p_user_id: activeFanUserId,
        p_amount: MESSAGE_COST,
        p_description: `Mensagem enviada ao artista ${artistId}`,
      });

      if (spendError) {
        alert(spendError.message);
        return;
      }

      const { error: messageError } = await supabase
        .from('topmusic_chat_messages')
        .insert({
          conversation_id: conversationId,
          fan_user_id: activeFanUserId,
          artist_id: artistId,
          sender_type: 'fan',
          message: cleanText,
        });

      if (messageError) {
        alert(messageError.message);
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
    await fetchCoinBalance();
    await fetchMessages();
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
        {giftAnimation && (
  <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
    <div className="animate-bounce text-7xl drop-shadow-2xl">
      {giftAnimation}
    </div>
  </div>
)}
      <div className="border-b border-white/10 bg-black/80 px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Chat</h1>
              <p className="text-xs text-gray-400">
                Conversa VIP com artista
              </p>
            </div>

            {viewerType === 'fan' && (
              <div className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-400">
                💰 {coinBalance} coins
              </div>
            )}
          </div>
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
      <p className="mb-3 text-center text-xs text-gray-400">
  ⚡ Fala directamente com o artista (1 coin por mensagem)
</p>

{viewerType === 'fan' && (
  <div className="mx-auto mb-3 flex max-w-2xl justify-center gap-2">
    {CHAT_GIFTS.map((gift) => (
      <button
        key={gift.cost}
        onClick={() => sendGift(gift.label, gift.cost)}
        disabled={coinBalance < gift.cost}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {gift.label} {gift.cost}
      </button>
    ))}
  </div>
)}

{viewerType === 'fan' && coinBalance > 0 && coinBalance <= 3 && (
  <div className="mx-auto mb-3 max-w-2xl rounded-xl bg-yellow-500/10 p-3 text-center text-sm text-yellow-400">
    ⚠️ Estás quase sem coins
  </div>
)}
        {viewerType === 'fan' && coinBalance < MESSAGE_COST && (
          <>
            <div className="mx-auto mb-3 max-w-2xl rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
              Precisas de pelo menos {MESSAGE_COST} coin para enviar mensagem.
            </div>

            <button
              onClick={() => onNavigate?.('buyCoins')}
              className="mx-auto mb-4 block rounded-full bg-yellow-500 px-5 py-2 text-sm font-bold text-black hover:opacity-90"
            >
              💰 Recarregar coins
            </button>
          </>
        )}

        {viewerType === 'fan' && coinBalance === 0 && (
  <div className="mx-auto mb-3 max-w-2xl rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
    🔒 A tua conversa foi interrompida — recarrega coins para continuar
  </div>
)}

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
            disabled={viewerType === 'fan' && coinBalance < MESSAGE_COST}
            className="rounded-full bg-purple-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {viewerType === 'fan'
              ? coinBalance >= MESSAGE_COST
                ? `Enviar 💬 (${MESSAGE_COST} coin)`
                : 'Sem coins'
              : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  );
}