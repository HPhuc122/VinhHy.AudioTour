import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { Lang } from '../hooks/useLanguage';

const en = {
  home: 'Home', map: 'Map', tours: 'Tours', packages: 'Passes / Scan QR', places: 'Places', search: 'Search',
  searchPlaceholder: 'Search places...', language: 'Language', menu: 'Menu', close: 'Close', explore: 'Explore', contact: 'Contact',
  footerTagline: 'A multilingual smart travel guide for Vinh Hy food street.', address: 'Vinh Hy food street, Ninh Thuan', rights: 'All rights reserved.',
  loading: 'Loading...', viewDetails: 'View details', viewMap: 'View on map', location: 'Location', listen: 'Listen to narration',
  choosePass: 'Choose a pass / scan QR', narration: 'Narration', narrationUpdating: 'Narration is being updated.',
  audioUnavailable: 'Audio is not available in the selected language.', accessRequired: 'Listening access required',
  accessRequiredMessage: 'Scan a QR code or choose a narration pass to listen.', notFoundPlace: 'This place could not be found.',
  backToPlaces: 'Back to places', notFoundTour: 'This tour could not be found.', backToTours: 'Back to tours',
  placesTitle: 'Places', placesSubtitle: 'Discover places and listen in your selected language.', toursTitle: 'Tours',
  toursSubtitle: 'Choose a route and explore each stop.', searchResults: 'Search results', noResults: 'No matching results.',
  minutes: 'minutes', stops: 'stops', startTour: 'Start tour', route: 'Route', selectedLanguageAudio: 'Audio in the selected language',
  heroTitle: 'Explore Vinh Hy with audio', heroText: 'Discover places, tours and narration in your preferred language.',
  explorePlaces: 'Explore places', exploreTours: 'Explore tours', featuredPlaces: 'Featured places', featuredTours: 'Featured tours', viewAll: 'View all',
  passesTitle: 'Area-wide narration passes', passesText: 'Choose a pass and use AudioTour during the granted time.',
  loadingPasses: 'Loading narration passes...', noPasses: 'No active narration passes.', free: 'Free', pay: 'Pay with MoMo',
  processing: 'Processing...', startListening: 'Start listening', passBenefitArea: 'Use AudioTour throughout the area',
  passBenefitPoi: 'Listen at places and along tour routes', passBenefitLanguage: 'Switch the website and audio language', accessExpired: 'Listening access has expired.', cannotPlay: 'Audio cannot be played.', accessRemaining: 'Listening time remaining', currentLocation: 'Your current location', locateMe: 'Use my current location', geoUnsupported: 'Location is not supported by this browser.', geoFailed: 'Unable to get your current location.',
} as const;

export type MessageKey = keyof typeof en;
type Messages = Partial<Record<MessageKey, string>>;

const vi: Messages = {
  home: 'Trang chủ', map: 'Bản đồ', tours: 'Tour', packages: 'Gói nghe / Quét QR', places: 'Địa điểm', search: 'Tìm',
  searchPlaceholder: 'Tìm kiếm địa điểm...', language: 'Ngôn ngữ', menu: 'Menu', close: 'Đóng', explore: 'Khám phá', contact: 'Liên hệ',
  footerTagline: 'Hệ thống hướng dẫn du lịch thông minh đa ngôn ngữ tại phố ẩm thực Vĩnh Hy.', address: 'Phố ẩm thực Vĩnh Hy, Ninh Thuận', rights: 'Đã đăng ký bản quyền.',
  loading: 'Đang tải...', viewDetails: 'Xem chi tiết', viewMap: 'Xem trên bản đồ', location: 'Vị trí', listen: 'Nghe thuyết minh',
  choosePass: 'Chọn gói nghe / quét QR', narration: 'Thuyết minh', narrationUpdating: 'Nội dung thuyết minh đang được cập nhật.',
  audioUnavailable: 'Chưa có audio cho ngôn ngữ đang chọn.', accessRequired: 'Cần quyền nghe', accessRequiredMessage: 'Quét QR hoặc chọn gói thuyết minh để nghe.',
  notFoundPlace: 'Không tìm thấy địa điểm này.', backToPlaces: 'Quay lại danh sách địa điểm', notFoundTour: 'Không tìm thấy tour này.', backToTours: 'Quay lại danh sách tour',
  placesTitle: 'Địa điểm', placesSubtitle: 'Khám phá địa điểm và nghe bằng ngôn ngữ bạn đã chọn.', toursTitle: 'Tour', toursSubtitle: 'Chọn lộ trình và khám phá từng điểm dừng.',
  searchResults: 'Kết quả tìm kiếm', noResults: 'Không có kết quả phù hợp.', minutes: 'phút', stops: 'điểm dừng', startTour: 'Bắt đầu tour', route: 'Lộ trình',
  selectedLanguageAudio: 'Audio theo ngôn ngữ đã chọn', heroTitle: 'Khám phá Vĩnh Hy bằng audio', heroText: 'Khám phá địa điểm, tour và thuyết minh bằng ngôn ngữ bạn muốn.',
  explorePlaces: 'Khám phá địa điểm', exploreTours: 'Khám phá tour', featuredPlaces: 'Địa điểm nổi bật', featuredTours: 'Tour nổi bật', viewAll: 'Xem tất cả',
  passesTitle: 'Gói thuyết minh toàn khu', passesText: 'Chọn gói và sử dụng AudioTour trong thời gian được cấp.', loadingPasses: 'Đang tải gói thuyết minh...',
  noPasses: 'Chưa có gói thuyết minh đang hoạt động.', free: 'Miễn phí', pay: 'Thanh toán MoMo', processing: 'Đang xử lý...', startListening: 'Bắt đầu nghe thuyết minh',
  passBenefitArea: 'Sử dụng AudioTour trong toàn khu', passBenefitPoi: 'Nghe tại POI và lộ trình tour', passBenefitLanguage: 'Đổi ngôn ngữ website và audio', accessExpired: 'Quyền nghe đã hết hạn.', cannotPlay: 'Không thể phát audio.', accessRemaining: 'Quyền nghe còn hiệu lực', currentLocation: 'Vị trí hiện tại của bạn', locateMe: 'Dùng vị trí hiện tại', geoUnsupported: 'Trình duyệt chưa hỗ trợ định vị.', geoFailed: 'Không thể lấy vị trí hiện tại.',
};

const zh: Messages = {
  home: '首页', map: '地图', tours: '游览路线', packages: '语音包 / 扫码', places: '景点', search: '搜索', searchPlaceholder: '搜索景点...', language: '语言',
  menu: '菜单', close: '关闭', explore: '探索', contact: '联系', footerTagline: '永熙美食街多语言智能旅游指南。', address: '宁顺省永熙美食街', rights: '版权所有。',
  loading: '加载中...', viewDetails: '查看详情', viewMap: '在地图上查看', location: '位置', listen: '收听讲解', choosePass: '选择语音包 / 扫码', narration: '语音讲解',
  narrationUpdating: '讲解内容正在更新。', audioUnavailable: '所选语言暂无音频。', accessRequired: '需要收听权限', accessRequiredMessage: '请扫描二维码或选择语音包。',
  notFoundPlace: '找不到此景点。', backToPlaces: '返回景点列表', notFoundTour: '找不到此路线。', backToTours: '返回路线列表', placesTitle: '景点',
  placesSubtitle: '使用所选语言探索和收听。', toursTitle: '游览路线', toursSubtitle: '选择路线并探索每一站。', searchResults: '搜索结果', noResults: '没有匹配结果。',
  minutes: '分钟', stops: '站', startTour: '开始游览', route: '路线', selectedLanguageAudio: '所选语言的音频', heroTitle: '用语音探索永熙', heroText: '用您喜欢的语言探索景点、路线和讲解。',
  explorePlaces: '探索景点', exploreTours: '探索路线', featuredPlaces: '精选景点', featuredTours: '精选路线', viewAll: '查看全部', passesTitle: '全区域语音包',
  passesText: '选择语音包并在有效期内使用。', loadingPasses: '正在加载语音包...', noPasses: '暂无可用语音包。', free: '免费', pay: '使用 MoMo 支付', processing: '处理中...',
  startListening: '开始收听', passBenefitArea: '全区域使用 AudioTour', passBenefitPoi: '收听景点和路线讲解', passBenefitLanguage: '切换网站和音频语言', accessExpired: '收听权限已过期。', cannotPlay: '无法播放音频。', accessRemaining: '剩余收听时间', currentLocation: '您的当前位置', locateMe: '使用当前位置', geoUnsupported: '浏览器不支持定位。', geoFailed: '无法获取当前位置。',
};

const ko: Messages = {
  home: '홈', map: '지도', tours: '투어', packages: '이용권 / QR 스캔', places: '장소', search: '검색', searchPlaceholder: '장소 검색...', language: '언어', menu: '메뉴', close: '닫기',
  explore: '둘러보기', contact: '연락처', footerTagline: '빈히 음식 거리의 다국어 스마트 여행 가이드입니다.', address: '닌투언 빈히 음식 거리', rights: '모든 권리 보유.',
  loading: '불러오는 중...', viewDetails: '상세 보기', viewMap: '지도에서 보기', location: '위치', listen: '해설 듣기', choosePass: '이용권 선택 / QR 스캔', narration: '오디오 해설',
  narrationUpdating: '해설을 업데이트 중입니다.', audioUnavailable: '선택한 언어의 오디오가 없습니다.', accessRequired: '청취 권한 필요', accessRequiredMessage: 'QR을 스캔하거나 이용권을 선택하세요.',
  notFoundPlace: '장소를 찾을 수 없습니다.', backToPlaces: '장소 목록으로', notFoundTour: '투어를 찾을 수 없습니다.', backToTours: '투어 목록으로', placesTitle: '장소',
  placesSubtitle: '선택한 언어로 장소를 둘러보고 들으세요.', toursTitle: '투어', toursSubtitle: '경로를 선택해 각 정류장을 둘러보세요.', searchResults: '검색 결과', noResults: '검색 결과가 없습니다.',
  minutes: '분', stops: '정류장', startTour: '투어 시작', route: '경로', selectedLanguageAudio: '선택한 언어의 오디오', heroTitle: '오디오로 빈히 탐험하기', heroText: '원하는 언어로 장소와 투어를 둘러보세요.',
  explorePlaces: '장소 둘러보기', exploreTours: '투어 둘러보기', featuredPlaces: '추천 장소', featuredTours: '추천 투어', viewAll: '전체 보기', passesTitle: '전 지역 해설 이용권',
  passesText: '이용권을 선택하고 유효 시간 동안 이용하세요.', loadingPasses: '이용권 불러오는 중...', noPasses: '활성 이용권이 없습니다.', free: '무료', pay: 'MoMo 결제', processing: '처리 중...',
  startListening: '해설 시작', passBenefitArea: '전 지역 AudioTour 이용', passBenefitPoi: '장소와 투어 해설 듣기', passBenefitLanguage: '웹사이트와 오디오 언어 변경', accessExpired: '청취 권한이 만료되었습니다.', cannotPlay: '오디오를 재생할 수 없습니다.', accessRemaining: '남은 청취 시간', currentLocation: '현재 위치', locateMe: '현재 위치 사용', geoUnsupported: '브라우저가 위치를 지원하지 않습니다.', geoFailed: '현재 위치를 가져올 수 없습니다.',
};

const ja: Messages = {
  home: 'ホーム', map: '地図', tours: 'ツアー', packages: 'パス / QRスキャン', places: 'スポット', search: '検索', searchPlaceholder: 'スポットを検索...', language: '言語', menu: 'メニュー', close: '閉じる',
  explore: '探索', contact: 'お問い合わせ', footerTagline: 'ヴィンヒーの多言語スマート観光ガイド。', address: 'ニントゥアン省ヴィンヒー', rights: '無断転載を禁じます。',
  loading: '読み込み中...', viewDetails: '詳細を見る', viewMap: '地図で見る', location: '場所', listen: '音声ガイドを聴く', choosePass: 'パスを選択 / QRスキャン', narration: '音声ガイド',
  narrationUpdating: 'ガイド内容を更新中です。', audioUnavailable: '選択した言語の音声はありません。', accessRequired: '再生権限が必要です', accessRequiredMessage: 'QRをスキャンするかパスを選択してください。',
  notFoundPlace: 'スポットが見つかりません。', backToPlaces: 'スポット一覧へ', notFoundTour: 'ツアーが見つかりません。', backToTours: 'ツアー一覧へ', placesTitle: 'スポット',
  placesSubtitle: '選択した言語で探索して聴くことができます。', toursTitle: 'ツアー', toursSubtitle: 'ルートを選んで各スポットを巡りましょう。', searchResults: '検索結果', noResults: '一致する結果はありません。',
  minutes: '分', stops: 'スポット', startTour: 'ツアー開始', route: 'ルート', selectedLanguageAudio: '選択した言語の音声', heroTitle: '音声でヴィンヒーを探索', heroText: 'お好みの言語でスポットやツアーを楽しめます。',
  explorePlaces: 'スポットを探索', exploreTours: 'ツアーを探索', featuredPlaces: 'おすすめスポット', featuredTours: 'おすすめツアー', viewAll: 'すべて見る', passesTitle: '全エリア音声パス',
  passesText: 'パスを選び、有効時間内にご利用ください。', loadingPasses: 'パスを読み込み中...', noPasses: '利用可能なパスはありません。', free: '無料', pay: 'MoMoで支払う', processing: '処理中...',
  startListening: '音声ガイドを開始', passBenefitArea: '全エリアでAudioTourを利用', passBenefitPoi: 'スポットとツアーの音声を再生', passBenefitLanguage: 'サイトと音声の言語を変更', accessExpired: '再生権限の有効期限が切れました。', cannotPlay: '音声を再生できません。', accessRemaining: '残り再生時間', currentLocation: '現在地', locateMe: '現在地を使用', geoUnsupported: 'ブラウザは位置情報に対応していません。', geoFailed: '現在地を取得できません。',
};

const fr: Messages = {
  home: 'Accueil', map: 'Carte', tours: 'Circuits', packages: 'Forfaits / Scanner QR', places: 'Lieux', search: 'Rechercher', searchPlaceholder: 'Rechercher un lieu...', language: 'Langue',
  menu: 'Menu', close: 'Fermer', explore: 'Explorer', contact: 'Contact', footerTagline: 'Guide touristique intelligent multilingue de Vinh Hy.', address: 'Vinh Hy, Ninh Thuan', rights: 'Tous droits réservés.',
  loading: 'Chargement...', viewDetails: 'Voir les détails', viewMap: 'Voir sur la carte', location: 'Emplacement', listen: 'Écouter la narration', choosePass: 'Choisir un forfait / scanner QR', narration: 'Narration audio',
  narrationUpdating: 'La narration est en cours de mise à jour.', audioUnavailable: "Aucun audio n'est disponible dans la langue sélectionnée.", accessRequired: "Accès d'écoute requis", accessRequiredMessage: 'Scannez un QR ou choisissez un forfait.',
  notFoundPlace: 'Ce lieu est introuvable.', backToPlaces: 'Retour aux lieux', notFoundTour: 'Ce circuit est introuvable.', backToTours: 'Retour aux circuits', placesTitle: 'Lieux',
  placesSubtitle: 'Explorez et écoutez dans la langue sélectionnée.', toursTitle: 'Circuits', toursSubtitle: 'Choisissez un itinéraire et découvrez chaque étape.', searchResults: 'Résultats de recherche', noResults: 'Aucun résultat correspondant.',
  minutes: 'minutes', stops: 'étapes', startTour: 'Démarrer le circuit', route: 'Itinéraire', selectedLanguageAudio: 'Audio dans la langue sélectionnée', heroTitle: 'Explorez Vinh Hy en audio', heroText: 'Découvrez les lieux et circuits dans votre langue.',
  explorePlaces: 'Explorer les lieux', exploreTours: 'Explorer les circuits', featuredPlaces: 'Lieux à découvrir', featuredTours: 'Circuits à découvrir', viewAll: 'Tout voir', passesTitle: 'Forfaits audio pour toute la zone',
  passesText: 'Choisissez un forfait et utilisez AudioTour pendant sa validité.', loadingPasses: 'Chargement des forfaits...', noPasses: 'Aucun forfait actif.', free: 'Gratuit', pay: 'Payer avec MoMo', processing: 'Traitement...',
  startListening: "Commencer l'écoute", passBenefitArea: 'AudioTour dans toute la zone', passBenefitPoi: 'Narration des lieux et circuits', passBenefitLanguage: 'Changer la langue du site et de l’audio', accessExpired: "L'accès d'écoute a expiré.", cannotPlay: "Impossible de lire l'audio.", accessRemaining: "Temps d'écoute restant", currentLocation: 'Votre position actuelle', locateMe: 'Utiliser ma position', geoUnsupported: "La localisation n'est pas prise en charge.", geoFailed: 'Impossible d’obtenir votre position.',
};

const messages: Record<Lang, Messages> = { vi, en, zh, ko, ja, fr };
interface I18nValue { lang: Lang; t: (key: MessageKey) => string; }
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = (key: MessageKey) => messages[lang][key] ?? en[key];
  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
