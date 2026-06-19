import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LANG_LABELS, type Lang } from '../../hooks/useLanguage';
import { ROUTES } from '../../routes/routeConstants';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export function Navbar({ lang, setLang }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();

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

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            V
          </div>
          <span className="hidden text-sm font-bold text-white sm:block">VinhHy AudioTour</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to={ROUTES.HOME} className={navLinkClass} end>
            Trang chủ
          </NavLink>
          <NavLink to={ROUTES.MAP} className={navLinkClass}>
            Bản đồ
          </NavLink>
          <NavLink to={ROUTES.TOURS} className={navLinkClass}>
            Tour
          </NavLink>
          <NavLink to={ROUTES.PACKAGES} className={navLinkClass}>
            Gói nghe / Quét QR
          </NavLink>
          <NavLink to={ROUTES.POIS} className={navLinkClass}>
            Địa điểm
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-gray-400 transition-colors hover:text-white"
            aria-label="Tìm kiếm"
          >
            Tìm
          </button>

          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as Lang)}
            className="hidden rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none sm:block"
            aria-label="Chọn ngôn ngữ"
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-400 hover:text-white md:hidden"
            aria-label="Mở menu"
          >
            {menuOpen ? 'Đóng' : 'Menu'}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-xl gap-2">
            <input
              autoFocus
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
              placeholder="Tìm kiếm địa điểm..."
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
            >
              Tìm
            </button>
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="flex flex-col gap-3 border-t border-gray-800 bg-gray-900 px-4 py-4 md:hidden">
          <NavLink to={ROUTES.HOME} className={navLinkClass} end onClick={() => setMenuOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to={ROUTES.MAP} className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Bản đồ
          </NavLink>
          <NavLink to={ROUTES.TOURS} className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Tour
          </NavLink>
          <NavLink to={ROUTES.PACKAGES} className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Gói nghe / Quét QR
          </NavLink>
          <NavLink to={ROUTES.POIS} className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Địa điểm
          </NavLink>
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as Lang)}
            className="rounded border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-gray-300 focus:outline-none sm:hidden"
            aria-label="Chọn ngôn ngữ"
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </nav>
  );
}
