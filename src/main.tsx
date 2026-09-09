import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapaCharlas } from '@/components/dashboard/mapa-charlas';
import '@/src/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MapaCharlas />
  </StrictMode>,
);
