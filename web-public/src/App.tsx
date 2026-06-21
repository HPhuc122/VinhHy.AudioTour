import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes/AppRouter';
import { useLanguage } from './hooks/useLanguage';
import { I18nProvider } from './i18n/I18nContext';

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
        <I18nProvider lang={lang}>
          <AppRouter lang={lang} setLang={setLang} />
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
