import { createDocument, createIdGenerator, createPage } from '@zunva/core';
import type { ProjectStore, ProjectSummary, StorageInfo } from '@zunva/platform';
import { useCallback, useEffect, useState } from 'react';

/** Random source backed by the browser's crypto (better than Math.random for IDs). */
const cryptoRandom = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) / 4294967296;
};
const newId = createIdGenerator(cryptoRandom);

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

type LoadState = { kind: 'loading' } | { kind: 'ready'; items: ProjectSummary[] } | { kind: 'error'; message: string };

/** Tab Dự án (G1-5): danh sách, tạo mới, đổi tên, xóa. Chưa có trình chỉnh sửa. */
export function Projects({ store }: { store: ProjectStore }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const refresh = useCallback(async () => {
    const result = await store.list();
    setState(result.ok ? { kind: 'ready', items: result.value } : { kind: 'error', message: result.error });
    const info = await store.storageInfo();
    setStorage(info.ok ? info.value : null);
  }, [store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function run(task: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await task());
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const createProject = () =>
    run(async () => {
      const doc = createDocument(newId('doc'), createPage(newId('page'), 1080, 1350), Date.now());
      const saved = await store.save(doc);
      return saved.ok ? null : saved.error;
    });

  const saveName = (id: string, name: string) =>
    run(async () => {
      const trimmed = name.trim();
      if (trimmed === '') return 'Tên dự án không được để trống.';
      const loaded = await store.load(id);
      if (!loaded.ok) return loaded.error;
      const saved = await store.save({ ...loaded.value, name: trimmed.slice(0, 120) });
      if (!saved.ok) return saved.error;
      setEditing(null);
      return null;
    });

  const removeProject = (item: ProjectSummary) => {
    if (!window.confirm(`Xóa dự án "${item.name}"? Sau khi xóa sẽ không lấy lại được.`)) return;
    void run(async () => {
      const removed = await store.remove(item.id);
      return removed.ok ? null : removed.error;
    });
  };

  return (
    <section className="projects" aria-labelledby="projects-title">
      <h1 id="projects-title">Dự án</h1>

      <button type="button" className="primary" disabled={busy} onClick={() => void createProject()}>
        + Tạo dự án mới
      </button>

      {message && (
        <p className="notice" role="alert">
          {message}
        </p>
      )}

      {state.kind === 'loading' && <p className="muted">Đang mở danh sách dự án…</p>}
      {state.kind === 'error' && (
        <p className="notice" role="alert">
          {state.message}
        </p>
      )}
      {state.kind === 'ready' && state.items.length === 0 && (
        <p className="muted">Chưa có dự án nào. Bấm "Tạo dự án mới" để bắt đầu.</p>
      )}

      {state.kind === 'ready' && state.items.length > 0 && (
        <ul className="project-list" aria-label="Danh sách dự án">
          {state.items.map((item) => (
            <li key={item.id} className="project">
              {editing?.id === item.id ? (
                <form
                  className="rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveName(item.id, editing.name);
                  }}
                >
                  <label className="visually-hidden" htmlFor={`rename-${item.id}`}>
                    Tên mới cho dự án
                  </label>
                  <input
                    id={`rename-${item.id}`}
                    value={editing.name}
                    maxLength={120}
                    autoFocus
                    onChange={(e) => setEditing({ id: item.id, name: e.target.value })}
                  />
                  <div className="row">
                    <button type="submit" className="primary" disabled={busy}>
                      Lưu tên
                    </button>
                    <button type="button" onClick={() => setEditing(null)}>
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="project-info">
                    <strong className="project-name">{item.name}</strong>
                    <span className="muted">Sửa lúc {dateFormat.format(item.updatedAt)}</span>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Đổi tên dự án ${item.name}`}
                      onClick={() => setEditing({ id: item.id, name: item.name })}
                    >
                      Đổi tên
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      aria-label={`Xóa dự án ${item.name}`}
                      onClick={() => removeProject(item)}
                    >
                      Xóa
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {storage && storage.quotaBytes > 0 && (
        <p className="muted small">
          Dự án lưu trên máy này. Đã dùng {formatSize(storage.usedBytes)} / khoảng {formatSize(storage.quotaBytes)}.
        </p>
      )}
    </section>
  );
}
