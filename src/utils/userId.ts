export function getUserId(): string {
  const STORAGE_KEY = 'topmusic_user_id';

  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}
