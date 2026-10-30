import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Stand firm offline cache registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
