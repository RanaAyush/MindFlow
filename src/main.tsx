import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MindMapProvider } from './contexts/MindMapContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MindMapProvider>
      <App />
    </MindMapProvider>
  </StrictMode>
);