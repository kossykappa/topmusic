import { useEffect, useState } from 'react';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import Navigation from './components/Navigation';
import Homepage from './components/Homepage';
import ArtistsListing from './components/ArtistsListing';
import ArtistPage from './components/ArtistPage';
import UploadMusic from './components/UploadMusic';
import Pricing from './components/Pricing';
import MusicPlayer from './components/MusicPlayer';
import RegionExplorer from './components/RegionExplorer';
import LivePage from './components/LivePage';
import { Feed } from './components/Feed';
import { supabase } from './lib/supabase';
import SendGift from './pages/SendGift';
import BuyCoins from './pages/BuyCoins';
import Wallet from './pages/Wallet';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import AdminWithdraw from './pages/AdminWithdraw';
import EarningsDashboard from './pages/EarningsDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import ArtistInbox from './pages/ArtistInbox';
import Chat from './pages/Chat';

type Page =
  | 'feed'
  | 'live'
  | 'artists'
  | 'artist'
  | 'upload'
  | 'wallet'
  | 'home'
  | 'pricing'
  | 'region'
  | 'sendGift'
  | 'buyCoins'
  | 'success'
  | 'adminWithdraw'
  | 'earningsDashboard'
  | 'secret-topmusic-admin'
  | 'financeDashboard'
  | 'artistInbox'
  | 'chat'
  | 'cancel';
  

interface PageData {
  artistId?: string;
  artistName?: string;
  artistHandle?: string;
  region?: string;
  fanUserId?: string; // 👈 ADICIONAR AQUI
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('feed');
  const [pageData, setPageData] = useState<PageData>({});
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchUnreadCount() {
  const { count } = await supabase
    .from('topmusic_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_type', 'fan')
    .is('read_at', null);

  setUnreadCount(count || 0);
}

  useEffect(() => {
    const url = new URL(window.location.href);
    const payment = url.searchParams.get('payment');

    if (payment === 'success') {
      setCurrentPage('wallet');
    }

    if (payment === 'cancel') {
      setCurrentPage('wallet');
    }
  }, []);

  useEffect(() => {
  fetchUnreadCount();

  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'artist_messages',
      },
      () => {
        fetchUnreadCount();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  function handleNavigate(page: string, data?: unknown) {
    setCurrentPage(page as Page);

    if (data) {
      setPageData(data as PageData);
    } else {
      setPageData({});
    }
  }

  const hideTopNavOnMobile =
    currentPage === 'feed' || currentPage === 'live';

  return (
    <MusicPlayerProvider>
      <div className="min-h-screen bg-black pb-24">
        <Navigation
  currentPage={currentPage}
  onNavigate={handleNavigate}
  hideTopNavOnMobile={hideTopNavOnMobile}
  unreadCount={unreadCount}
/>

        {currentPage === 'feed' && <Feed onNavigate={handleNavigate} />}
        {currentPage === 'live' && <LivePage onNavigate={handleNavigate} />}
        {currentPage === 'wallet' && <Wallet onNavigate={handleNavigate} />}
        {currentPage === 'buyCoins' && <BuyCoins onNavigate={handleNavigate} />}
        {currentPage === 'secret-topmusic-admin' && <AdminWithdraw />}
        {currentPage === 'earningsDashboard' && <EarningsDashboard />}
        {currentPage === 'financeDashboard' && <FinanceDashboard />}
        {currentPage === 'artistInbox' && (
  <ArtistInbox onNavigate={handleNavigate} />
)}
        {currentPage === 'chat' && pageData?.artistId && (
  <Chat
    artistId={pageData.artistId}
    fanUserId={pageData.fanUserId}
  />
)}
        {currentPage === 'success' && (
          <CheckoutSuccess onNavigate={handleNavigate} />
        )}
        {currentPage === 'cancel' && (
          <CheckoutCancel onNavigate={handleNavigate} />
        )}
        {currentPage === 'artists' && (
          <ArtistsListing onNavigate={handleNavigate} />
        )}
        {currentPage === 'artist' && pageData.artistId && (
          <ArtistPage
            artistId={pageData.artistId}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'upload' && (
          <UploadMusic onNavigate={handleNavigate} />
        )}
        {currentPage === 'home' && <Homepage onNavigate={handleNavigate} />}
        {currentPage === 'pricing' && <Pricing />}
        {currentPage === 'region' && pageData.region && (
          <RegionExplorer
            region={pageData.region}
            onBack={() => handleNavigate('feed')}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'sendGift' && (
          <SendGift onNavigate={handleNavigate} />
        )}

        <MusicPlayer />
      </div>
    </MusicPlayerProvider>
  );
}

export default App;