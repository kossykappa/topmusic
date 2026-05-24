import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(t('notificationsLoadError'), error);
      setItems([]);
    } else {
      setItems((data || []) as NotificationItem[]);
    }

    setLoading(false);
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        {t('loadingNotifications')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
              <Bell className="h-4 w-4 text-red-400" />
              {t('topMusic')}
            </div>

            <h1 className="text-4xl font-black">
              {t('notifications')}
            </h1>

            <p className="mt-2 text-white/50">
              {t('notificationsSubtitle')}
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
          >
            <CheckCheck className="h-4 w-4" />
            {t('markAllRead')}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 py-16 text-center text-white/50">
            {t('noNotificationsYet')}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 ${
                  item.is_read
                    ? 'border-white/10 bg-white/5'
                    : 'border-red-500/40 bg-red-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black text-white">{item.title}</h3>

                    {item.message && (
                      <p className="mt-1 text-sm text-white/60">
                        {item.message}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-white/35">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold">
                      {t('new')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}