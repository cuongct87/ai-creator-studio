//! Phần thuần (không cần Tauri) của việc lưu file: làm sạch tên, giải mã tên, tìm tên chưa trùng,
//! kiểm tra đường dẫn nằm trong thư mục cho phép. Có test chạy bằng `cargo test` hoặc `rustc --test`.

use std::path::{Path, PathBuf};

/// Tối đa 300 MB mỗi file (bằng giới hạn file .zunva).
pub const MAX_BYTES: usize = 300 * 1024 * 1024;
const MAX_NAME_CHARS: usize = 120;
const RESERVED: [&str; 22] = [
    "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1",
    "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/// Giải mã tên kiểu `encodeURIComponent` (%XX, UTF-8). Sai định dạng → None.
pub fn percent_decode(input: &str) -> Option<String> {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            let hex = input.get(i + 1..i + 3)?;
            out.push(u8::from_str_radix(hex, 16).ok()?);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}

/// Tên file an toàn trên Windows: bỏ ký tự cấm và ký tự điều khiển, bỏ dấu chấm/khoảng trắng ở cuối,
/// tránh tên thiết bị (CON, NUL…), tối đa 120 ký tự, không có thư mục con.
pub fn safe_file_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| if (c as u32) < 32 || "\\/:*?\"<>|".contains(c) { '_' } else { c })
        .collect();
    let mut s: String = cleaned.trim().chars().take(MAX_NAME_CHARS).collect();
    while s.ends_with('.') || s.ends_with(' ') {
        s.pop();
    }
    let s = s.trim_start_matches(['.', ' ']).to_string();
    if s.is_empty() {
        return "artio".to_string();
    }
    let stem = s.split('.').next().unwrap_or("").trim().to_ascii_uppercase();
    if RESERVED.contains(&stem.as_str()) {
        return format!("_{s}");
    }
    s
}

/// "a.png" đã có → "a (2).png", "a (3).png"…
pub fn unique_path(dir: &Path, name: &str) -> PathBuf {
    let first = dir.join(name);
    if !first.exists() {
        return first;
    }
    let (stem, ext) = match name.rfind('.') {
        Some(i) if i > 0 => (&name[..i], &name[i..]),
        _ => (name, ""),
    };
    let mut n = 2;
    loop {
        let candidate = dir.join(format!("{stem} ({n}){ext}"));
        if !candidate.exists() || n > 9999 {
            return candidate;
        }
        n += 1;
    }
}

/// Đường dẫn (đã chuẩn hóa) có nằm trong một trong các thư mục cho phép không.
pub fn is_inside(path: &Path, roots: &[PathBuf]) -> bool {
    roots.iter().any(|root| path.starts_with(root) && path != root.as_path())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_encode_uri_component() {
        assert_eq!(percent_decode("Thi%E1%BB%87p%20c%C6%B0%E1%BB%9Bi%20-%201.png").as_deref(), Some("Thiệp cưới - 1.png"));
        assert_eq!(percent_decode("abc").as_deref(), Some("abc"));
        assert_eq!(percent_decode("bad%zz"), None);
        assert_eq!(percent_decode("cut%E"), None);
        assert_eq!(percent_decode("%FF"), None);
    }

    #[test]
    fn cleans_names_for_windows() {
        assert_eq!(safe_file_name("Thiệp cưới - 1.png"), "Thiệp cưới - 1.png");
        assert_eq!(safe_file_name("..\\..\\Windows\\a.png"), "_.._Windows_a.png");
        assert_eq!(safe_file_name("a/b:c*?.pdf"), "a_b_c__.pdf");
        assert_eq!(safe_file_name("tên.  "), "tên");
        assert_eq!(safe_file_name("   "), "artio");
        assert_eq!(safe_file_name("..."), "artio");
        assert_eq!(safe_file_name("con.png"), "_con.png");
        assert_eq!(safe_file_name("NUL"), "_NUL");
        assert_eq!(safe_file_name("console.png"), "console.png");
        assert_eq!(safe_file_name(&"a".repeat(300)).chars().count(), 120);
        assert_eq!(safe_file_name("x\u{0007}y.png"), "x_y.png");
    }

    #[test]
    fn finds_free_name() {
        let dir = std::env::temp_dir().join(format!("artio-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        assert_eq!(unique_path(&dir, "a.png"), dir.join("a.png"));
        std::fs::write(dir.join("a.png"), b"1").unwrap();
        assert_eq!(unique_path(&dir, "a.png"), dir.join("a (2).png"));
        std::fs::write(dir.join("a (2).png"), b"1").unwrap();
        assert_eq!(unique_path(&dir, "a.png"), dir.join("a (3).png"));
        std::fs::write(dir.join("noext"), b"1").unwrap();
        assert_eq!(unique_path(&dir, "noext"), dir.join("noext (2)"));
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn only_inside_allowed_roots() {
        let roots = vec![PathBuf::from("/home/u/Pictures/Artio"), PathBuf::from("/home/u/Downloads/Artio")];
        assert!(is_inside(Path::new("/home/u/Pictures/Artio/a.png"), &roots));
        assert!(!is_inside(Path::new("/home/u/Pictures/Artio"), &roots));
        assert!(!is_inside(Path::new("/home/u/Pictures/a.png"), &roots));
        assert!(!is_inside(Path::new("/home/u/Pictures/ArtioX/a.png"), &roots));
    }
}
