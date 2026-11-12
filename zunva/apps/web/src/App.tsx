import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_NAME, type Id } from '@zunva/core';
import { createIndexedDbProjectStore, createPlatform } from '@zunva/platform';
import { EditorScreen } from './EditorScreen';
import { Home } from './Home';
import { Projects } from './Projects';
import { applyTheme, loadThemeId, saveThemeId, type ThemeId } from './theme';
import { ThemeSwitch } from './ThemeSwitch';

/** Một kho cho cả app (cơ sở dữ liệu IndexedDB tên "c87" — tên nội bộ, giữ để không mất dự án đã lưu). */
const projectStore = createIndexedDbProjectStore();
/** Web hoặc Android (khi chạy trong vỏ Artio có cầu nối Java). */
const platform = createPlatform();

type TabId = 'home' | 'projects' | 'templates' | 'ai' | 'account';

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'projects', label: 'Dự án' },
  { id: 'templates', label: 'Mẫu' },
  { id: 'ai', label: 'AI' },
  { id: 'account', label: 'Tài khoản' },
];

/** Dự án đang mở nằm trên địa chỉ (`?project=<id>`), để nút Back của Android quay về trang trước. */
function projectFromUrl(): Id | null {
  return new URLSearchParams(window.location.search).get('project');
}

export function App() {
  const [tab, setTab] = useState<TabId>('home');
  const [openProject, setOpenProject] = useState<Id | null>(projectFromUrl);
  const [theme, setTheme] = useState<ThemeId>(loadThemeId);

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    const onPop = () => setOpenProject(projectFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const changeTheme = useCallback((id: ThemeId) => {
    setTheme(id);
    saveThemeId(id);
  }, []);

  const open = useCallback((id: Id) => {
    window.history.pushState({ project: id }, '', `?project=${encodeURIComponent(id)}`);
    setOpenProject(id);
  }, []);

  const back = useCallback(() => {
    if (window.history.state && typeof window.history.state === 'object' && 'project' in window.history.state) {
      window.history.back();
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      setOpenProject(null);
    }
  }, []);

  if (openProject) {
    return <EditorScreen key={openProject} store={projectStore} platform={platform} projectId={openProject} onBack={back} />;
  }

  const current = TABS.find((t) => t.id === tab) ?? TABS[0]!;

  return (
    <div className="app">
      <header className="top">
        <span className="logo">{PRODUCT_NAME}</span>
      </header>

      <main className="content">
        {tab === 'home' ? (
          <Home store={projectStore} platform={platform} theme={theme} onThemeChange={changeTheme} onOpen={open} />
        ) : tab === 'projects' ? (
          <Projects store={projectStore} platform={platform} onOpen={open} />
        ) : tab === 'account' ? (
          <section className="account">
            <h1>Tài khoản</h1>
            <h2>Màu giao diện</h2>
            <ThemeSwitch value={theme} onChange={changeTheme} />
            <p className="muted small">Chỉ đổi màu của ứng dụng, không đổi màu thiết kế của bạn.</p>
          </section>
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
