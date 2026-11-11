import type { DesignDocument } from '@zunva/core';
import type { PlatformResult, ProjectStore } from './index';

/**
 * Tự lưu (G1-5): gom nhiều thay đổi liên tiếp thành một lần ghi, sau khi người dùng
 * ngừng tay `delayMs`; lưu ngay khi trang bị ẩn (chuyển app, khóa màn hình, đóng tab).
 * Các lần ghi chạy lần lượt, không chồng lên nhau.
 */

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface AutosaveState {
  status: AutosaveStatus;
  /** Lỗi tiếng Việt khi status = 'error'. */
  error: string | null;
  /** Bản đã lưu gần nhất (có updatedAt do kho ghi). */
  lastSaved: DesignDocument | null;
}

/** Thứ có `visibilityState` và sự kiện `visibilitychange` (thường là `document`). */
export interface VisibilityTarget {
  readonly visibilityState: string;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
  removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export interface AutosaveOptions {
  onState?: (state: AutosaveState) => void;
  /** null = không theo dõi ẩn trang. Mặc định là `document` nếu có. */
  visibilityTarget?: VisibilityTarget | null;
}

export interface Autosave {
  /** Báo có thay đổi; lưu sau khi ngừng tay. */
  schedule(doc: DesignDocument): void;
  /** Lưu ngay bản đang chờ (nếu có). Trả null khi không có gì để lưu. */
  flush(): Promise<PlatformResult<DesignDocument> | null>;
  /** Lưu nốt bản đang chờ rồi ngừng theo dõi. */
  dispose(): Promise<void>;
}

export function createAutosave(store: ProjectStore, delayMs = 800, options: AutosaveOptions = {}): Autosave {
  const target =
    options.visibilityTarget !== undefined
      ? options.visibilityTarget
      : typeof document !== 'undefined'
        ? document
        : null;

  let pending: DesignDocument | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  let disposed = false;
  let state: AutosaveState = { status: 'idle', error: null, lastSaved: null };

  const emit = (next: Partial<AutosaveState>) => {
    state = { ...state, ...next };
    options.onState?.(state);
  };

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  function flush(): Promise<PlatformResult<DesignDocument> | null> {
    clearTimer();
    const doc = pending;
    pending = null;
    if (!doc) return queue.then(() => null);
    const job = queue.then(async (): Promise<PlatformResult<DesignDocument>> => {
      emit({ status: 'saving' });
      let result: PlatformResult<DesignDocument>;
      try {
        result = await store.save(doc);
      } catch {
        result = { ok: false, error: 'Không lưu được dự án. Hãy thử lại.' };
      }
      if (result.ok) {
        emit({ status: pending ? 'pending' : 'saved', error: null, lastSaved: result.value });
      } else {
        // Keep the unsaved version so the next flush (or hiding the page) retries it.
        if (!pending) pending = doc;
        emit({ status: 'error', error: result.error });
      }
      return result;
    });
    queue = job.catch(() => undefined);
    return job;
  }

  const onVisibility = () => {
    if (target?.visibilityState === 'hidden') void flush();
  };
  target?.addEventListener('visibilitychange', onVisibility);

  return {
    schedule(doc) {
      if (disposed) return;
      pending = doc;
      emit({ status: 'pending' });
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        void flush();
      }, delayMs);
    },
    flush,
    async dispose() {
      if (disposed) return;
      disposed = true;
      target?.removeEventListener('visibilitychange', onVisibility);
      await flush();
    },
  };
}
