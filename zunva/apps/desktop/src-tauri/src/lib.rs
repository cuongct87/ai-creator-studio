//! Vỏ Windows của Artio (G4): cửa sổ WebView2 hiển thị app web (`apps/web/dist`) + 2 lệnh riêng.
//! App chỉ ghi được vào Pictures\Artio và Downloads\Artio; không có lệnh đọc file tùy ý.

mod files;

use std::path::PathBuf;
use tauri::ipc::{InvokeBody, Request};
use tauri::{AppHandle, Manager};

fn artio_dir(app: &AppHandle, folder: &str) -> Result<PathBuf, String> {
    let base = match folder {
        "pictures" => app.path().picture_dir(),
        "downloads" => app.path().download_dir(),
        _ => return Err("Thư mục lưu không hợp lệ.".into()),
    }
    .map_err(|_| "Không tìm thấy thư mục Ảnh/Tải xuống trên máy.".to_string())?;
    Ok(base.join("Artio"))
}

fn header<'a>(request: &'a Request<'_>, name: &str) -> Option<&'a str> {
    request.headers().get(name).and_then(|v| v.to_str().ok())
}

/// Ghi byte (thân lệnh, dạng thô) vào Pictures\Artio hoặc Downloads\Artio. Trả đường dẫn đầy đủ.
/// Tiêu đề: `x-artio-folder` = pictures | downloads; `x-artio-name` = tên file (mã hóa URL).
#[tauri::command]
async fn save_file(app: AppHandle, request: Request<'_>) -> Result<String, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Dữ liệu lưu không hợp lệ.".into());
    };
    if bytes.len() > files::MAX_BYTES {
        return Err("File quá lớn để lưu (tối đa 300 MB).".into());
    }
    let folder = header(&request, "x-artio-folder").ok_or("Thiếu thư mục lưu.")?;
    let name = header(&request, "x-artio-name")
        .and_then(files::percent_decode)
        .ok_or("Tên file không hợp lệ.")?;
    let dir = artio_dir(&app, folder)?;
    std::fs::create_dir_all(&dir).map_err(|_| "Không tạo được thư mục Artio.".to_string())?;
    let path = files::unique_path(&dir, &files::safe_file_name(&name));
    std::fs::write(&path, bytes).map_err(|e| {
        if e.kind() == std::io::ErrorKind::StorageFull {
            "Ổ đĩa đầy, không lưu được file.".to_string()
        } else {
            "Không lưu được file vào máy. Hãy thử lại.".to_string()
        }
    })?;
    Ok(path.to_string_lossy().into_owned())
}

/// Mở Explorer, chọn sẵn file vừa lưu. Chỉ nhận file nằm trong Pictures\Artio hoặc Downloads\Artio.
#[tauri::command]
fn reveal_file(app: AppHandle, path: String) -> Result<(), String> {
    let refused = || "Không mở được thư mục.".to_string();
    let real = std::fs::canonicalize(&path).map_err(|_| refused())?;
    let roots: Vec<PathBuf> = ["pictures", "downloads"]
        .iter()
        .filter_map(|f| artio_dir(&app, f).ok())
        .filter_map(|d| std::fs::canonicalize(d).ok())
        .collect();
    if !files::is_inside(&real, &roots) {
        return Err(refused());
    }
    open_in_explorer(&path).map_err(|_| refused())
}

#[cfg(windows)]
fn open_in_explorer(path: &str) -> std::io::Result<()> {
    use std::os::windows::process::CommandExt;
    std::process::Command::new("explorer").raw_arg(format!("/select,\"{path}\"")).spawn().map(|_| ())
}

#[cfg(not(windows))]
fn open_in_explorer(_path: &str) -> std::io::Result<()> {
    Err(std::io::Error::other("chỉ có trên Windows"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_file, reveal_file])
        .run(tauri::generate_context!())
        .expect("Artio không khởi động được");
}
