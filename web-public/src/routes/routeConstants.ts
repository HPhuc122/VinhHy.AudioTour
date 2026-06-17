export const ROUTES = {
  HOME: '/',
  POIS: '/dia-diem',
  POI_DETAIL: '/dia-diem/:id',
  TOURS: '/tours',
  PACKAGES: '/goi-thuyet-minh',
  TOUR_DETAIL: '/tours/:id',
  TOUR_ROUTE: '/tours/:id/route',
  MAP: '/ban-do',
  SEARCH: '/tim-kiem',
  QR: '/qr/:code',
} as const;
