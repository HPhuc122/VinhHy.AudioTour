import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LANG_LABELS, type Lang } from '../../hooks/useLanguage';
import { useI18n } from '../../i18n/I18nContext';
import { ROUTES } from '../../routes/routeConstants';

interface Props { lang: Lang; setLang: (language: Lang) => void; }

export function Navbar({ lang, setLang }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQ.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`;
  const links = [
    { to: ROUTES.HOME, label: t('home'), end: true },
    { to: ROUTES.MAP, label: t('map') },
    { to: ROUTES.TOURS, label: t('tours') },
    { to: ROUTES.PACKAGES, label: t('packages') },
    { to: ROUTES.POIS, label: t('places') },
  ];

  const languageSelect = (mobile = false) => (
    <select
      value={lang}
      onChange={(event) => setLang(event.target.value as Lang)}
      className={`${mobile ? 'sm:hidden py-2' : 'hidden sm:block py-1'} rounded border border-gray-700 bg-gray-800 px-2 text-xs text-gray-300 focus:outline-none`}
      aria-label={t('language')}
    >
      {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
        <option key={code} value={code}>{code.toUpperCase()} {label}</option>
      ))}
    </select>
  );

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">K</div>
          <span className="hidden text-sm font-bold text-white sm:block">KhanhHoi AudioTour</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.end}>{link.label}</NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-400 transition-colors hover:text-white" aria-label={t('search')}>
            {t('search')}
          </button>
          {languageSelect()}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 hover:text-white md:hidden" aria-label={t('menu')}>
            {menuOpen ? t('close') : t('menu')}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-xl gap-2">
            <input autoFocus value={searchQ} onChange={(event) => setSearchQ(event.target.value)} placeholder={t('searchPlaceholder')} className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700">{t('search')}</button>
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="flex flex-col gap-3 border-t border-gray-800 bg-gray-900 px-4 py-4 md:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.end} onClick={() => setMenuOpen(false)}>{link.label}</NavLink>
          ))}
          {languageSelect(true)}
        </div>
      ) : null}
    </nav>
  );
}
