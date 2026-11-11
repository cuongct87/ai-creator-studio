import { useState } from 'react';
import { PRODUCT_NAME } from '@zunva/core';

type TabId = 'home' | 'projects' | 'templates' | 'ai' | 'account';

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'projects', label: 'Dự án' },
  { id: 'templates', label: 'Mẫu' },
  { id: 'ai', label: 'AI' },
  { id: 'account', label: 'Tài khoản' },
];

/** Khung nội bộ G1-2: chỉ có bố cục, chưa có chức năng. Chưa phát hành. */
export function App() {
  const [tab, setTab] = useState<TabId>('home');
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]!;

  return (
    <div className="app">
      <header className="top">
        <span className="logo">{PRODUCT_NAME}</span>
      </header>

      <main className="content">
        {tab === 'home' ? (
          <h1>Bạn muốn tạo gì hôm nay?</h1>
        ) : (
          <h1>{current.label}</h1>
        )}
      </main>

      <nav className="tabs" aria-label="Điều hướng chính">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={t.id === tab ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
