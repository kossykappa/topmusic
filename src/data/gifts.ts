export type GiftCategory = 'popular' | 'music' | 'vip' | 'luxury' | 'universe';

export type GiftTier = 'small' | 'medium' | 'big' | 'mega';

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: GiftCategory;
  tier: GiftTier;
}

export const gifts: Gift[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', price: 1, category: 'popular', tier: 'small' },
  { id: 'fire', name: 'Fire', emoji: '🔥', price: 5, category: 'popular', tier: 'small' },
  { id: 'heart', name: 'Heart', emoji: '❤️', price: 10, category: 'popular', tier: 'small' },
  { id: 'star', name: 'Star', emoji: '⭐', price: 15, category: 'popular', tier: 'small' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', price: 50, category: 'popular', tier: 'medium' },
  { id: 'crown', name: 'Crown', emoji: '👑', price: 100, category: 'popular', tier: 'medium' },

  { id: 'mic', name: 'Golden Mic', emoji: '🎤', price: 150, category: 'music', tier: 'medium' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', price: 200, category: 'music', tier: 'medium' },
  { id: 'speaker', name: 'Golden Speaker', emoji: '🔊', price: 300, category: 'music', tier: 'medium' },
  { id: 'dj', name: 'DJ Set', emoji: '🎧', price: 500, category: 'music', tier: 'big' },
  { id: 'piano', name: 'Golden Piano', emoji: '🎹', price: 750, category: 'music', tier: 'big' },
  { id: 'concert', name: 'Concert Ticket', emoji: '🎫', price: 1000, category: 'music', tier: 'big' },

  { id: 'vip-pass', name: 'VIP Pass', emoji: '🎟️', price: 1500, category: 'vip', tier: 'big' },
  { id: 'rocket', name: 'Music Rocket', emoji: '🚀', price: 2500, category: 'vip', tier: 'big' },
  { id: 'superfan', name: 'Super Fan', emoji: '🫶', price: 5000, category: 'vip', tier: 'mega' },
  { id: 'private-show', name: 'Private Concert', emoji: '🎪', price: 7500, category: 'vip', tier: 'mega' },

  { id: 'arena', name: 'TopMusic Arena', emoji: '🏟️', price: 10000, category: 'luxury', tier: 'mega' },
  { id: 'castle', name: 'Music Castle', emoji: '🏰', price: 15000, category: 'luxury', tier: 'mega' },
  { id: 'lion', name: 'African Lion', emoji: '🦁', price: 25000, category: 'luxury', tier: 'mega' },
  { id: 'sold-out', name: 'Sold Out Arena', emoji: '🎆', price: 50000, category: 'luxury', tier: 'mega' },

  { id: 'galaxy', name: 'TopMusic Galaxy', emoji: '🌌', price: 75000, category: 'universe', tier: 'mega' },
  { id: 'superstar', name: 'Superstar Crown', emoji: '👑', price: 100000, category: 'universe', tier: 'mega' },
  { id: 'music-universe', name: 'Music Universe', emoji: '🪐', price: 150000, category: 'universe', tier: 'mega' },
  { id: 'topmusic-universe', name: 'TopMusic Universe', emoji: '🌍', price: 250000, category: 'universe', tier: 'mega' },
];