export const routes = {
  login: '/login',
  dashboard: '/',
  tours: '/tours',
  tourCreate: '/tours/new',
  tourEdit: '/tours/:tourId/edit',
  media: '/media',
  qr: '/qr',
  qrCreate: '/qr/create',
  qrEdit: '/qr/:id/edit',
} as const;
