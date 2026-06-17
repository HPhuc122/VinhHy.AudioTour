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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-bold text-white text-sm hidden sm:block">VinhHy AudioTour</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to={ROUTES.HOME} className={navLinkClass} end>Trang chủ</NavLink>
          <NavLink to={ROUTES.POIS} className={navLinkClass}>Địa điểm</NavLink>
          <NavLink to={ROUTES.TOURS} className={navLinkClass}>Tour</NavLink>
          <NavLink to={ROUTES.MAP} className={navLinkClass}>Bản đồ</NavLink>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Tìm kiếm"
          >
            🔍
          </button>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none hidden sm:block"
            aria-label="Chọn ngôn ngữ"
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
            aria-label="Mở menu"
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-800 px-4 py-3 bg-gray-900">
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <input
              autoFocus
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm kiếm địa điểm..."
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              Tìm
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-4 flex flex-col gap-3">
          <NavLink to={ROUTES.HOME} className={navLinkClass} end onClick={() => setMenuOpen(false)}>Trang chủ</NavLink>
          <NavLink to={ROUTES.POIS} className={navLinkClass} onClick={() => setMenuOpen(false)}>Địa điểm</NavLink>
          <NavLink to={ROUTES.TOURS} className={navLinkClass} onClick={() => setMenuOpen(false)}>Tour</NavLink>
          <NavLink to={ROUTES.MAP} className={navLinkClass} onClick={() => setMenuOpen(false)}>Bản đồ</NavLink>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-2 border border-gray-700 focus:outline-none sm:hidden"
            aria-label="Chọn ngôn ngữ"
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
