import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface Request {
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/**
 * Hộp hỏi riêng của Artio, thay `window.confirm` (trên Android hiện dòng
 * "Trang tại https://appassets…" rất khó hiểu). Dùng: `const [dialog, ask] = useConfirm();`
 * rồi `if (await ask('Xóa?', { confirmLabel: 'Xóa', danger: true })) …`, và đặt `{dialog}` trong JSX.
 */
export function useConfirm(): [ReactNode, (message: string, options?: { confirmLabel?: string; danger?: boolean }) => Promise<boolean>] {
  const [request, setRequest] = useState<Request | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback(
    (message: string, options: { confirmLabel?: string; danger?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        setRequest({ message, confirmLabel: options.confirmLabel ?? 'Đồng ý', danger: options.danger ?? false, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      request?.resolve(ok);
      setRequest(null);
    },
    [request],
  );

  useEffect(() => {
    if (!request) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, close]);

  const dialog = request ? (
    <div className="dialog-backdrop" onClick={() => close(false)}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-message">{request.message}</p>
        <div className="row dialog-actions">
          <button ref={cancelRef} type="button" onClick={() => close(false)}>
            Hủy
          </button>
          <button type="button" className={request.danger ? 'danger-fill' : 'primary'} onClick={() => close(true)}>
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return [dialog, ask];
}
