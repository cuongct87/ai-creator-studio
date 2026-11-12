import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { applyTheme, loadThemeId } from './theme';

// Gắn màu trước khi vẽ lần đầu để không bị nháy màu mặc định.
applyTheme(loadThemeId());

const root = document.getElementById('root');
if (!root) throw new Error('Thiếu phần tử #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
