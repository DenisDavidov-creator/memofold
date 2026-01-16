import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App';
import '@mantine/core/styles.css';
import { DraftProvider } from './app/providers/DraftProviders';

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Verdana, sans-serif',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // forceColorScheme="light" принудительно включает светлую тему
  <MantineProvider theme={theme} defaultColorScheme="light">
    <DraftProvider>
      <App />
    </DraftProvider>
  </MantineProvider>
);