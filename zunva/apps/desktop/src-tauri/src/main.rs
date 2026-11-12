// Bản phát hành không mở cửa sổ dòng lệnh đen phía sau app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    artio_desktop_lib::run()
}
