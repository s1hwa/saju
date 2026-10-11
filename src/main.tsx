import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/song-myung/400.css';
import '@fontsource/nanum-myeongjo/400.css';
import '@fontsource/nanum-myeongjo/700.css';
import '@fontsource/nanum-myeongjo/800.css';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
