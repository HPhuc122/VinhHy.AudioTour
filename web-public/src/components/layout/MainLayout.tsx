import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import type { Lang } from '../../hooks/useLanguage';
import { usePresenceHeartbeat } from '../../hooks/usePresenceHeartbeat';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export function MainLayout({ lang, setLang }: Props) {
  // Single heartbeat loop for the entire public site.
  // poiId is read from PresenceContext — PoiDetailPage sets it via useSetPresencePoi.
  usePresenceHeartbeat();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar lang={lang} setLang={setLang} />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
