import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes/AppRouter';
import { useLanguage } from './hooks/useLanguage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

export default function App() {
  const { lang, setLang } = useLanguage();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppRouter lang={lang} setLang={setLang} />
      </QueryClientProvider>
    </BrowserRouter>
  );
}
