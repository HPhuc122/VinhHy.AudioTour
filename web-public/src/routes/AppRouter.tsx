import { Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../features/home/HomePage';
import { PoisPage } from '../features/pois/PoisPage';
import { PoiDetailPage } from '../features/pois/PoiDetailPage';
import { ToursPage } from '../features/tours/ToursPage';
import { TourDetailPage } from '../features/tours/TourDetailPage';
import { TourRoutePage } from '../features/tours/TourRoutePage';
import { MapPage } from '../features/map/MapPage';
import { SearchPage } from '../features/search/SearchPage';
import { QrLandingPage } from '../features/qr/QrLandingPage';
import { ROUTES } from './routeConstants';
import type { Lang } from '../hooks/useLanguage';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export function AppRouter({ lang, setLang }: Props) {
  return (
    <Routes>
      <Route element={<MainLayout lang={lang} setLang={setLang} />}>
        <Route path={ROUTES.HOME} element={<HomePage lang={lang} />} />
        <Route path={ROUTES.POIS} element={<PoisPage lang={lang} />} />
        <Route path={ROUTES.POI_DETAIL} element={<PoiDetailPage lang={lang} />} />
        <Route path={ROUTES.TOURS} element={<ToursPage lang={lang} />} />
        <Route path={ROUTES.TOUR_DETAIL} element={<TourDetailPage lang={lang} />} />
        <Route path={ROUTES.TOUR_ROUTE} element={<TourRoutePage lang={lang} />} />
        <Route path={ROUTES.MAP} element={<MapPage lang={lang} />} />
        <Route path={ROUTES.SEARCH} element={<SearchPage lang={lang} />} />
        <Route path={ROUTES.QR} element={<QrLandingPage lang={lang} />} />
      </Route>
    </Routes>
  );
}
