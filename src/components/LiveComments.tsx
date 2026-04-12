import { useEffect, useState } from 'react';

interface CommentItem {
  id: number;
  user: string;
  text: string;
}

const seedComments = [
  { user: 'Carlos M', text: '🔥 Grande som!' },
  { user: 'Ana K', text: 'Maya está mesmo forte hoje' },
  { user: 'Lito Beats', text: 'Esse beat está limpo 🎶' },
  { user: 'Fã #27', text: 'Enviei presente agora 💎' },
  { user: 'Joana P', text: 'Quero esta música completa!' },
  { user: 'Dino Live', text: 'TopMusic vai longe 👏' },
  { user: 'Rita S', text: 'Coroa para a artista 👑' },
  { user: 'Mário V', text: 'Angola tem talento mesmo' },
];

export default function LiveComments() {
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    let nextId = 1;

    function pushComment() {
      const random = seedComments[Math.floor(Math.random() * seedComments.length)];
      const item = { id: nextId++, ...random };

      setComments((prev) => [...prev.slice(-4), item]);
    }

    pushComment();
    pushComment();

    const interval = window.setInterval(() => {
      pushComment();
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute bottom-24 left-4 z-20 w-[320px] space-y-2">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="animate-fade-in rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
        >
          <div className="text-xs font-bold text-pink-300">{comment.user}</div>
          <div className="text-sm text-white">{comment.text}</div>
        </div>
      ))}
    </div>
  );
}