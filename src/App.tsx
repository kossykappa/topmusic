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
import { Feed } from './components/Feed';
import SendGift from './pages/SendGift';

type Page =
  | 'home'
  | 'artists'
  | 'artist'
  | 'upload'
  | 'pricing'
  | 'region'
  | 'feed'
  | 'sendGift';

interface PageData {
  artistId?: string;
  region?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<PageData>({});

  function handleNavigate(page: string, data?: unknown) {
    setCurrentPage(page as Page);
    if (data) {
      setPageData(data as PageData);
    } else {
      setPageData({});
    }
  }

  return (
    <MusicPlayerProvider>
      <div className="min-h-screen bg-black pb-24">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

        {currentPage === 'home' && <Homepage onNavigate={handleNavigate} />}
        {currentPage === 'artists' && <ArtistsListing onNavigate={handleNavigate} />}
        {currentPage === 'artist' && pageData.artistId && (
          <ArtistPage artistId={pageData.artistId} />
        )}
        {currentPage === 'upload' && <UploadMusic onNavigate={handleNavigate} />}
        {currentPage === 'pricing' && <Pricing />}
        {currentPage === 'region' && pageData.region && (
          <RegionExplorer
            region={pageData.region}
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'sendGift' && <SendGift />}

        <MusicPlayer />
      </div>
    </MusicPlayerProvider>
  );
}

export default App;