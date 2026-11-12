import type { Id } from '@zunva/core';
import type { Platform, ProjectStore, ProjectSummary } from '@zunva/platform';
import { useEffect, useMemo, useState } from 'react';
import { createBlankProject, createPhotoProject, type CreateResult } from './create-project';
import { thumbAssetId } from './EditorScreen';
import { PAGE_SIZES, searchStartOptions, type StartOption } from './start-options';
import type { ThemeId } from './theme';
import { ThemeSwitch } from './ThemeSwitch';

const RECENT_LIMIT = 10;
const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

interface HomeProps {
  store: ProjectStore;
  platform: Platform;
  theme: ThemeId;
  onThemeChange(id: ThemeId): void;
  onOpen(id: Id): void;
}

/** Trang chủ (G2 R3): một câu hỏi + ô tìm, "Tiếp tục thiết kế", nút tròn theo mục đích. */
export function Home({ store, platform, theme, onThemeChange, onOpen }: HomeProps) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<ProjectSummary[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askingSize, setAskingSize] = useState<StartOption | null>(null);
  const [thumbs, setThumbs] = useState<Record<Id, string>>({});

  useEffect(() => {
    let alive = true;
    const created: string[] = [];
    void store.list().then(async (r) => {
      if (!alive) return;
      const items = r.ok ? r.value.slice(0, RECENT_LIMIT) : [];
      setRecent(items);
      // Ảnh thu nhỏ do màn hình chỉnh sửa lưu lại; chưa có thì hiện chữ cái đầu.
      for (const p of items) {
        const t = await store.getAsset(thumbAssetId(p.id));
        if (!alive) return;
        if (!t.ok) continue;
        const url = URL.createObjectURL(new Blob([t.value.bytes.slice()], { type: t.value.mimeType }));
        created.push(url);
        setThumbs((prev) => ({ ...prev, [p.id]: url }));
      }
    });
    return () => {
      alive = false;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [store]);

  const options = useMemo(() => searchStartOptions(query), [query]);

  async function finish(task: Promise<CreateResult>) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await task;
      if (result === null) return;
      if (result.ok) onOpen(result.id);
      else setMessage(result.error);
    } finally {
      setBusy(false);
    }
  }

  function start(option: StartOption) {
    if (busy) return;
    if (option.kind === 'photo') return void finish(createPhotoProject(store, platform, option));
    if (option.size === null) return setAskingSize(option);
    // Hình nền: đúng kích thước màn hình máy nếu nền tảng cho biết (Android).
    const screen = option.kind === 'wallpaper' ? platform.screenSize?.() : null;
    const pageSize = screen ? { ...option.size, width: screen.width, height: screen.height } : option.size;
    void finish(createBlankProject(store, option, pageSize));
  }

  return (
    <div className="home">
      <div className="home-head">
        <h1>Bạn muốn tạo gì hôm nay?</h1>
        <ThemeSwitch value={theme} onChange={onThemeChange} compact />
      </div>

      <label className="search">
        <span className="visually-hidden">Tìm loại thiết kế</span>
        <input
          type="search"
          value={query}
          placeholder="Thiệp cưới, bảng hiệu, giảm giá…"
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
        />
      </label>

      {message && (
        <p className="notice" role="alert">
          {message}
        </p>
      )}

      {query.trim() === '' && (
        <section aria-labelledby="recent-title">
          <h2 id="recent-title">Tiếp tục thiết kế</h2>
          {recent === null ? (
            <ul className="recent" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="recent-card skeleton" />
              ))}
            </ul>
          ) : recent.length === 0 ? (
            <p className="muted small">Chưa có thiết kế nào. Chọn một cách bắt đầu bên dưới.</p>
          ) : (
            <ul className="recent" aria-label="Thiết kế gần đây">
              {recent.map((p) => (
                <li key={p.id}>
                  <button type="button" className="recent-card" onClick={() => onOpen(p.id)}>
                    {thumbs[p.id] ? (
                      <img className="recent-thumb" src={thumbs[p.id]} alt="" />
                    ) : (
                      <span className="recent-thumb" aria-hidden="true">
                        {p.name.trim().charAt(0).toUpperCase() || '·'}
                      </span>
                    )}
                    <span className="recent-name">{p.name}</span>
                    <span className="muted small">{dateFormat.format(p.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="start-title">
        <h2 id="start-title">{query.trim() === '' ? 'Chọn cách bắt đầu' : 'Kết quả'}</h2>
        {options.length === 0 ? (
          <p className="muted small">Chưa có loại thiết kế "{query.trim()}". Thử "Trang trắng" để tự làm.</p>
        ) : (
          <ul className="starts">
            {options.map((o) => (
              <li key={o.kind}>
                <button type="button" className="start" disabled={busy} onClick={() => start(o)}>
                  <span className="start-icon" style={{ background: o.tint, color: o.ink }} aria-hidden="true">
                    {o.icon}
                  </span>
                  <span className="start-label">{o.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {askingSize && (
        <div className="dialog-backdrop" onClick={() => setAskingSize(null)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="size-title" onClick={(e) => e.stopPropagation()}>
            <p id="size-title">Chọn khổ cho thiết kế</p>
            <ul className="size-list">
              {PAGE_SIZES.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const option = askingSize;
                      setAskingSize(null);
                      void finish(createBlankProject(store, option, s));
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setAskingSize(null)}>
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
