import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CommentItem {
  id: number;
  user: string;
  text: string;
}

export default function LiveComments() {
  const { t } = useTranslation();

  const seedComments = [
    {
      user: 'Carlos M',
      text: t('liveComment1'),
    },
    {
      user: 'Ana K',
      text: t('liveComment2'),
    },
    {
      user: 'Lito Beats',
      text: t('liveComment3'),
    },
    {
      user: 'Fã #27',
      text: t('liveComment4'),
    },
    {
      user: 'Joana P',
      text: t('liveComment5'),
    },
    {
      user: 'Dino Live',
      text: t('liveComment6'),
    },
    {
      user: 'Rita S',
      text: t('liveComment7'),
    },
    {
      user: 'Mário V',
      text: t('liveComment8'),
    },
  ];

  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    let nextId = 1;

    function pushComment() {
      const random =
        seedComments[
          Math.floor(
            Math.random() * seedComments.length
          )
        ];

      const item = {
        id: nextId++,
        ...random,
      };

      setComments((prev) => [
        ...prev.slice(-4),
        item,
      ]);
    }

    pushComment();
    pushComment();

    const interval =
      window.setInterval(() => {
        pushComment();
      }, 2200);

    return () =>
      window.clearInterval(interval);
  }, [seedComments]);

  return (
    <div className="pointer-events-none absolute bottom-24 left-4 z-20 w-[320px] space-y-2">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="animate-fade-in rounded-2xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
        >
          <div className="text-xs font-bold text-pink-300">
            {comment.user}
          </div>

          <div className="text-sm text-white">
            {comment.text}
          </div>
        </div>
      ))}
    </div>
  );
}