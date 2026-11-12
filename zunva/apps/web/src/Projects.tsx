import { createDocument, createPage, type Id } from '@zunva/core';
import type { Platform, ProjectStore, ProjectSummary, StorageInfo } from '@zunva/platform';
import { useCallback, useEffect, useState } from 'react';
import { useConfirm } from './ConfirmDialog';
import { newId } from './create-project';
import { exportProject, importProject } from './zunva-io';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

type LoadState = { kind: 'loading' } | { kind: 'ready'; items: ProjectSummary[] } | { kind: 'error'; message: string };

/** Tab Dự án (G1-5, G1-7, G2): danh sách, mở, tạo mới, đổi tên, xóa, lưu/mở file .zunva. */
export function Projects({ store, platform, onOpen }: { store: ProjectStore; platform: Platform; onOpen(id: Id): void }) {
  const [dialog, ask] = useConfirm();
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

  const saveFile = (item: ProjectSummary) => run(() => exportProject(store, platform, item.id, Date.now()));

  const openFile = () => run(() => importProject(store, platform, () => newId('doc')));

  const removeProject = async (item: ProjectSummary) => {
    const ok = await ask(`Xóa dự án "${item.name}"? Sau khi xóa sẽ không lấy lại được.`, { confirmLabel: 'Xóa', danger: true });
    if (!ok) return;
    void run(async () => {
      const removed = await store.remove(item.id);
      return removed.ok ? null : removed.error;
    });
  };

  return (
    <section className="projects" aria-labelledby="projects-title">
      <h1 id="projects-title">Dự án</h1>

      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={() => void createProject()}>
          + Tạo dự án mới
        </button>
        <button type="button" disabled={busy} onClick={() => void openFile()}>
          Mở file .zunva
        </button>
      </div>

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
                      className="primary"
                      disabled={busy}
                      aria-label={`Mở dự án ${item.name}`}
                      onClick={() => onOpen(item.id)}
                    >
                      Mở
                    </button>
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
                      disabled={busy}
                      aria-label={`Lưu file .zunva của dự án ${item.name}`}
                      onClick={() => void saveFile(item)}
                    >
                      Lưu file
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      aria-label={`Xóa dự án ${item.name}`}
                      onClick={() => void removeProject(item)}
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

      <p className="muted small">
        File .zunva bạn lưu nằm trong thư mục Tải xuống/Artio. Khi bấm "Mở file .zunva", chọn ☰ → Tải xuống → Artio.
      </p>

      {storage && storage.quotaBytes > 0 && (
        <p className="muted small">
          Dự án lưu trên máy này. Đã dùng {formatSize(storage.usedBytes)} / khoảng {formatSize(storage.quotaBytes)}.
        </p>
      )}
      {dialog}
    </section>
  );
}
