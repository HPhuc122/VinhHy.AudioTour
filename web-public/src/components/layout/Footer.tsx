import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 text-sm mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">V</div>
            <span className="font-semibold text-white">VinhHy AudioTour</span>
          </div>
          <p className="text-xs leading-relaxed">Hệ thống hướng dẫn du lịch thông minh đa ngôn ngữ tại phố ẩm thực Vĩnh Hy.</p>
        </div>

        <div>
          <p className="font-semibold text-white mb-3">Khám phá</p>
          <ul className="space-y-2 text-xs">
            <li><Link to={ROUTES.HOME} className="hover:text-emerald-400 transition-colors">Trang chủ</Link></li>
            <li><Link to={ROUTES.POIS} className="hover:text-emerald-400 transition-colors">Địa điểm</Link></li>
            <li><Link to={ROUTES.TOURS} className="hover:text-emerald-400 transition-colors">Tour</Link></li>
            <li><Link to={ROUTES.MAP} className="hover:text-emerald-400 transition-colors">Bản đồ</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-white mb-3">Liên hệ</p>
          <ul className="space-y-2 text-xs">
            <li>Phố ẩm thực Vĩnh Hy, Ninh Thuận</li>
            <li>info@vinhhytour.vn</li>
            <li>0123 456 789</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 text-center py-4 text-xs">
        © {new Date().getFullYear()} VinhHy AudioTour. All rights reserved.
      </div>
    </footer>
  );
}
