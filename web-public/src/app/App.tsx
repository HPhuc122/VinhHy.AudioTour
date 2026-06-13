import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { QrLandingPage } from '@/features/qr/pages/QrLandingPage';
import { TourDetailPage } from '@/features/tours/pages/TourDetailPage';
import { TourListPage } from '@/features/tours/pages/TourListPage';
import { TourRoutePage } from '@/features/tours/pages/TourRoutePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<TourListPage />} />
            <Route path="/tours" element={<TourListPage />} />
            <Route path="/tours/:id" element={<TourDetailPage />} />
            <Route path="/tours/:id/route" element={<TourRoutePage />} />
            <Route path="/qr/:code" element={<QrLandingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
