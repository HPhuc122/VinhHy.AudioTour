import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { ROUTES } from '../../routes/routeConstants';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-gray-800 bg-gray-900 text-sm text-gray-400">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">K</div>
            <span className="font-semibold text-white">KhanhHoi AudioTour</span>
          </div>
          <p className="text-xs leading-relaxed">{t('footerTagline')}</p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">{t('explore')}</p>
          <ul className="space-y-2 text-xs">
            <li><Link to={ROUTES.HOME} className="transition-colors hover:text-emerald-400">{t('home')}</Link></li>
            <li><Link to={ROUTES.POIS} className="transition-colors hover:text-emerald-400">{t('places')}</Link></li>
            <li><Link to={ROUTES.TOURS} className="transition-colors hover:text-emerald-400">{t('tours')}</Link></li>
            <li><Link to={ROUTES.MAP} className="transition-colors hover:text-emerald-400">{t('map')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">{t('contact')}</p>
          <ul className="space-y-2 text-xs"><li>{t('address')}</li><li>info@khanhhoitour.vn</li><li>0123 456 789</li></ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs">© {new Date().getFullYear()} KhanhHoi AudioTour. {t('rights')}</div>
    </footer>
  );
}
