import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core'; // Added ColorSchemeScript
import App from './App';
import '@mantine/core/styles.css';
import { DraftProvider } from './app/providers/DraftProviders';
import { ReviewProvider } from './app/providers/ReviewProvider';

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Verdana, sans-serif',
  // You can customize dark mode colors here if needed
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    {/* This prevents the white flicker on refresh */}
    <ColorSchemeScript defaultColorScheme="auto" /> 
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DraftProvider>
        <ReviewProvider>
          <App />
        </ReviewProvider>
      </DraftProvider>
    </MantineProvider>
  </>
);