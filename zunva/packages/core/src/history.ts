import type { DesignDocument } from './model';
import type { Op } from './ops';
import { applyOp } from './ops';

/**
 * Lịch sử hoàn tác/làm lại theo lệnh.
 *
 * Mỗi bước hoàn tác là một "giao dịch" gồm một hay nhiều op. Không chụp lại cả thiết kế:
 * mỗi giao dịch chỉ lưu op đã làm và op đảo ngược, nên tốn rất ít bộ nhớ dù thiết kế
 * có ảnh lớn.
 *
 * Gộp bước: thao tác liên tục (kéo một vật, kéo thanh cỡ chữ) gửi cùng `mergeKey`;
 * các lần gửi liên tiếp cùng khóa được gộp thành MỘT bước hoàn tác.
 *
 * Mọi hàm đều thuần: trả về trạng thái mới, không sửa trạng thái cũ.
 */

export interface Transaction {
  label: string;
  /** Op theo thứ tự đã áp dụng. */
  ops: Op[];
  /** Op đảo ngược, theo thứ tự cần áp dụng để hoàn tác (ngược với ops). */
  inverses: Op[];
  mergeKey: string | null;
}

export interface HistoryState {
  doc: DesignDocument;
  undoStack: Transaction[];
  redoStack: Transaction[];
  /** Số bước hoàn tác tối đa được giữ. */
  limit: number;
  /** Tăng mỗi khi tài liệu đổi; dùng để biết cần tự lưu. */
  version: number;
}

export function createHistory(doc: DesignDocument, limit = 200): HistoryState {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit phải là số nguyên >= 1');
  return { doc, undoStack: [], redoStack: [], limit, version: 0 };
}

export interface ExecuteOptions {
  /** Gộp với bước trước nếu bước trước có cùng mergeKey. */
  mergeKey?: string;
}

/** Áp dụng các op như MỘT bước hoàn tác. Nếu op nào lỗi thì không đổi gì (ném OpError). */
export function execute(state: HistoryState, label: string, ops: Op[], options: ExecuteOptions = {}): HistoryState {
  if (ops.length === 0) return state;
  let doc = state.doc;
  const inverses: Op[] = [];
  for (const op of ops) {
    const res = applyOp(doc, op);
    doc = res.doc;
    inverses.unshift(res.inverse);
  }

  const mergeKey = options.mergeKey ?? null;
  const top = state.undoStack[state.undoStack.length - 1];
  let undoStack: Transaction[];
  if (mergeKey !== null && top && top.mergeKey === mergeKey) {
    const merged: Transaction = compactUpdate(top, ops, inverses) ?? {
      label: top.label,
      ops: [...top.ops, ...ops],
      inverses: [...inverses, ...top.inverses],
      mergeKey,
    };
    undoStack = [...state.undoStack.slice(0, -1), merged];
  } else {
    undoStack = [...state.undoStack, { label, ops: [...ops], inverses, mergeKey }];
    if (undoStack.length > state.limit) undoStack = undoStack.slice(undoStack.length - state.limit);
  }

  return { ...state, doc, undoStack, redoStack: [], version: state.version + 1 };
}

/**
 * Thu gọn khi gộp: nếu bước trước và lần mới đều là MỘT lệnh sửa cùng một lớp (hay gặp khi kéo),
 * chỉ giữ một lệnh với giá trị mới nhất; lệnh đảo ngược giữ giá trị CŨ NHẤT. Nhờ vậy kéo 120 lần
 * vẫn chỉ là 1 thao tác, hoàn tác chạy 1 bước.
 */
function compactUpdate(top: Transaction, ops: Op[], inverses: Op[]): Transaction | null {
  const [a] = top.ops;
  const [b] = ops;
  const [invA] = top.inverses;
  const [invB] = inverses;
  if (top.ops.length !== 1 || ops.length !== 1 || !a || !b || !invA || !invB) return null;
  if (a.op !== 'updateLayer' || b.op !== 'updateLayer' || invA.op !== 'updateLayer' || invB.op !== 'updateLayer') return null;
  if (a.pageId !== b.pageId || a.layerId !== b.layerId) return null;
  return {
    label: top.label,
    ops: [{ ...a, set: { ...a.set, ...b.set } }],
    // Trường mới xuất hiện ở lần sau lấy giá trị cũ từ invB; trường đã có giữ giá trị cũ nhất từ invA.
    inverses: [{ ...invA, set: { ...invB.set, ...invA.set } }],
    mergeKey: top.mergeKey,
  };
}

/** Kết thúc chuỗi gộp: lần execute sau dù cùng mergeKey cũng thành bước mới (ví dụ khi thả tay). */
export function closeMerge(state: HistoryState): HistoryState {
  const top = state.undoStack[state.undoStack.length - 1];
  if (!top || top.mergeKey === null) return state;
  return { ...state, undoStack: [...state.undoStack.slice(0, -1), { ...top, mergeKey: null }] };
}

export const canUndo = (state: HistoryState): boolean => state.undoStack.length > 0;
export const canRedo = (state: HistoryState): boolean => state.redoStack.length > 0;

export function undo(state: HistoryState): HistoryState {
  const tx = state.undoStack[state.undoStack.length - 1];
  if (!tx) return state;
  let doc = state.doc;
  for (const op of tx.inverses) doc = applyOp(doc, op).doc;
  return {
    ...state,
    doc,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, { ...tx, mergeKey: null }],
    version: state.version + 1,
  };
}

export function redo(state: HistoryState): HistoryState {
  const tx = state.redoStack[state.redoStack.length - 1];
  if (!tx) return state;
  let doc = state.doc;
  for (const op of tx.ops) doc = applyOp(doc, op).doc;
  return {
    ...state,
    doc,
    undoStack: [...state.undoStack, tx],
    redoStack: state.redoStack.slice(0, -1),
    version: state.version + 1,
  };
}

/** Nhãn của bước sẽ được hoàn tác/làm lại, để hiện trên nút (ví dụ "Hoàn tác: Đổi màu chữ"). */
export const undoLabel = (state: HistoryState): string | null => state.undoStack[state.undoStack.length - 1]?.label ?? null;
export const redoLabel = (state: HistoryState): string | null => state.redoStack[state.redoStack.length - 1]?.label ?? null;
