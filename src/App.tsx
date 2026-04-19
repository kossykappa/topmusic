import { useState } from 'react';
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
import SendGift from './pages/SendGift';
import BuyCoins from './pages/BuyCoins';
import Wallet from './pages/Wallet';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';

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
  | 'success'
  | 'cancel';

interface PageData {
  artistId?: string;
  artistName?: string;
  artistHandle?: string;
  region?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('feed');
  const [pageData, setPageData] = useState<PageData>({});

  useEffect(() => {
  const url = new URL(window.location.href);

  if (url.searchParams.get('success')) {
    setFlashMessage('Pagamento concluído 💰');
  }
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
        />

        {currentPage === 'feed' && <Feed onNavigate={handleNavigate} />}
        {currentPage === 'live' && <LivePage onNavigate={handleNavigate} />}
        {currentPage === 'wallet' && <Wallet onNavigate={handleNavigate} />}
        {currentPage === 'success' && <CheckoutSuccess onNavigate={handleNavigate} />}
        {currentPage === 'cancel' && <CheckoutCancel onNavigate={handleNavigate} />}
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
        {currentPage === 'wallet' && (
          <BuyCoins onNavigate={handleNavigate} />
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