/**
 * Đồng hồ đo cho kịch bản tự kiểm tra trên điện thoại: chỉ ghi khi kịch bản đã tạo `window.__artioMarks`.
 * Người dùng thường không có mảng này nên không tốn gì.
 */
export function perfMark(label: string): void {
  const marks = (globalThis as { __artioMarks?: Array<[string, number]> }).__artioMarks;
  if (Array.isArray(marks)) marks.push([label, performance.now()]);
}

