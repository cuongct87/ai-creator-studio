import { THEMES, type ThemeId } from './theme';

/** Chọn màu giao diện: 3 ô màu tròn (compact, trên trang chủ) hoặc danh sách có tên (tab Tài khoản). */
export function ThemeSwitch({ value, onChange, compact = false }: { value: ThemeId; onChange(id: ThemeId): void; compact?: boolean }) {
  return (
    <div className={compact ? 'theme-switch compact' : 'theme-switch'} role="radiogroup" aria-label="Màu giao diện">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === value}
          aria-label={`Màu ${t.label}`}
          title={t.label}
          onClick={() => onChange(t.id)}
        >
          <span className="swatch" style={{ background: t.colors.bg, borderColor: t.colors.accent }} aria-hidden="true">
            <span style={{ background: t.colors.accent }} />
          </span>
          {!compact && <span>{t.label}</span>}
        </button>
      ))}
    </div>
  );
}
