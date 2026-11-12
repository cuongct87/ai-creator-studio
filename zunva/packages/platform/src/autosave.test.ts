import { createDocument, createPage, type DesignDocument } from '@zunva/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutosave, type AutosaveState, type VisibilityTarget } from './autosave';
import type { PlatformResult, ProjectStore } from './index';

function makeDoc(name: string): DesignDocument {
  return createDocument('doc_1', createPage('page_1', 1080, 1350), 0, { name });
}

/** Store double that records every save. */
function fakeStore(failFirst = false): { store: ProjectStore; saved: string[] } {
  const saved: string[] = [];
  let calls = 0;
  const notUsed = async (): Promise<PlatformResult<never>> => ({ ok: false, error: 'không dùng' });
  const store: ProjectStore = {
    list: notUsed,
    load: notUsed,
    remove: notUsed,
    putAsset: notUsed,
    getAsset: notUsed,
    storageInfo: notUsed,
    collectUnusedAssets: notUsed,
    async save(doc) {
      calls++;
      if (failFirst && calls === 1) return { ok: false, error: 'Máy hết chỗ lưu.' };
      saved.push(doc.name);
      return { ok: true, value: { ...doc, updatedAt: 42 } };
    },
  };
  return { store, saved };
}

class FakeVisibility implements VisibilityTarget {
  visibilityState = 'visible';
  private listeners = new Set<() => void>();
  addEventListener(_: 'visibilitychange', l: () => void) {
    this.listeners.add(l);
  }
  removeEventListener(_: 'visibilitychange', l: () => void) {
    this.listeners.delete(l);
  }
  hide() {
    this.visibilityState = 'hidden';
    for (const l of this.listeners) l();
  }
  get count() {
    return this.listeners.size;
  }
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createAutosave', () => {
  it('gom nhiều thay đổi liên tiếp thành một lần ghi (bản cuối cùng)', async () => {
    const { store, saved } = fakeStore();
    const auto = createAutosave(store, 800, { visibilityTarget: null });
    auto.schedule(makeDoc('v1'));
    await vi.advanceTimersByTimeAsync(500);
    auto.schedule(makeDoc('v2'));
    await vi.advanceTimersByTimeAsync(500);
    auto.schedule(makeDoc('v3'));
    expect(saved).toEqual([]);
    await vi.advanceTimersByTimeAsync(799);
    expect(saved).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(saved).toEqual(['v3']);
  });

  it('lưu ngay khi trang bị ẩn', async () => {
    const { store, saved } = fakeStore();
    const vis = new FakeVisibility();
    const auto = createAutosave(store, 800, { visibilityTarget: vis });
    auto.schedule(makeDoc('đang sửa'));
    vis.hide();
    await vi.advanceTimersByTimeAsync(0);
    expect(saved).toEqual(['đang sửa']);
    // The timer was cancelled: no second save later.
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual(['đang sửa']);
  });

  it('báo trạng thái: chờ → đang lưu → đã lưu', async () => {
    const { store } = fakeStore();
    const states: AutosaveState['status'][] = [];
    const auto = createAutosave(store, 100, { visibilityTarget: null, onState: (s) => states.push(s.status) });
    auto.schedule(makeDoc('a'));
    await vi.advanceTimersByTimeAsync(100);
    expect(states).toEqual(['pending', 'saving', 'saved']);
  });

  it('lưu lỗi thì giữ bản chưa lưu và thử lại ở lần sau', async () => {
    const { store, saved } = fakeStore(true);
    let last: AutosaveState | null = null;
    const auto = createAutosave(store, 100, { visibilityTarget: null, onState: (s) => (last = s) });
    auto.schedule(makeDoc('quan trọng'));
    await vi.advanceTimersByTimeAsync(100);
    expect(last).toMatchObject({ status: 'error', error: 'Máy hết chỗ lưu.' });
    const retry = await auto.flush();
    expect(retry?.ok).toBe(true);
    expect(saved).toEqual(['quan trọng']);
  });

  it('flush khi không có gì chờ thì trả null; dispose lưu nốt và bỏ theo dõi', async () => {
    const { store, saved } = fakeStore();
    const vis = new FakeVisibility();
    const auto = createAutosave(store, 800, { visibilityTarget: vis });
    expect(await auto.flush()).toBeNull();
    auto.schedule(makeDoc('cuối'));
    expect(vis.count).toBe(1);
    await auto.dispose();
    expect(saved).toEqual(['cuối']);
    expect(vis.count).toBe(0);
    auto.schedule(makeDoc('sau khi dừng'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(saved).toEqual(['cuối']);
  });
});
