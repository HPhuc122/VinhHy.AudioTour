import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './routes/AppRouter';
import { useLanguage } from './hooks/useLanguage';
import { I18nProvider } from './i18n/I18nContext';
import { PresenceContext, usePresenceProviderState } from './hooks/usePresenceHeartbeat';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

export default function App() {
  const { lang, setLang, setLangFromBrowser } = useLanguage();
  const presenceValue = usePresenceProviderState();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider lang={lang}>
          <PresenceContext.Provider value={presenceValue}>
            <AppRouter lang={lang} setLang={setLang} setLangFromBrowser={setLangFromBrowser} />
          </PresenceContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
