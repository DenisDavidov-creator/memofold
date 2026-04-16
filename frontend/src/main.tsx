import ReactDOM from 'react-dom/client';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { DraftProvider } from './app/providers/DraftProviders';
import { ReviewProvider } from './app/providers/ReviewProvider';
import { theme } from './styles/theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" zIndex={1000} />
      <DraftProvider>
        <ReviewProvider>
          <App />
        </ReviewProvider>
      </DraftProvider>
    </MantineProvider>
  </>
);
