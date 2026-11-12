package vn.iaysystem.aicreatorstudio;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private WebView web;
    /** Khung ngoài WebView: chừa chỗ cho thanh trạng thái / thanh điều hướng (Android 15 vẽ tràn viền). */
    private FrameLayout root;
    private ValueCallback<Uri[]> chooser;
    private static final int PICK_FILE = 100;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html";
    /**
     * Max decoded size for AndroidFileSaver. The file crosses the JS bridge as one base64 string
     * (about 4/3 of the size, held twice in memory), so keep this well below the WebView heap.
     */
    private static final int MAX_SAVE_BYTES = 100 * 1024 * 1024;
    private static final String TOO_LARGE = "File quá lớn để lưu trên điện thoại (tối đa 100 MB).";
    private static final String OUT_OF_MEMORY = "File quá lớn, bộ nhớ máy không đủ để xử lý. Hãy đóng bớt ứng dụng rồi thử lại.";

    /** App web báo màu nền giao diện (Xanh nhạt / Hồng phấn / Tối) để tô dải thanh trạng thái cùng màu. */
    public class ShellBridge {
        @JavascriptInterface public void setBarColor(String hex) {
            final int color;
            try { color = Color.parseColor(hex); } catch (IllegalArgumentException e) { return; }
            runOnUiThread(() -> applyBarColor(color));
        }
    }

    private void applyBarColor(int color) {
        if (root != null) root.setBackgroundColor(color);
        boolean light = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255.0 > 0.6;
        if (Build.VERSION.SDK_INT < 35) {
            getWindow().setStatusBarColor(color);
            getWindow().setNavigationBarColor(color);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            if (c != null) c.setSystemBarsAppearance(light ? mask : 0, mask);
        } else {
            View decor = getWindow().getDecorView();
            int flags = decor.getSystemUiVisibility();
            flags = light ? (flags | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) : (flags & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            decor.setSystemUiVisibility(flags);
        }
    }

    /** Saves rendered images to the gallery (Pictures/Artio). Kept from v1.5. */
    public class ImageSaver {
        @JavascriptInterface
        public void saveImage(String dataUrl, String fileName) {
            new Thread(() -> {
                try {
                    int comma = dataUrl.indexOf(',');
                    if (comma < 0 || !dataUrl.substring(0, comma).contains(";base64")) throw new IOException("Invalid image data");
                    String header = dataUrl.substring(0, comma);
                    String mime = header.contains("image/jpeg") ? "image/jpeg" : header.contains("image/webp") ? "image/webp" : "image/png";
                    String ext = mime.equals("image/jpeg") ? ".jpg" : mime.equals("image/webp") ? ".webp" : ".png";
                    byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                    String safeName = safeFileName(fileName);
                    if (!safeName.toLowerCase(Locale.ROOT).endsWith(ext)) safeName = safeName + ext;
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                        throw new IOException("Android 10+ required for direct gallery save");
                    }
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Images.Media.MIME_TYPE, mime);
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Artio");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                    Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) throw new IOException("Cannot create image file");
                    try {
                        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                            if (out == null) throw new IOException("Cannot write image");
                            out.write(bytes);
                        }
                        ContentValues done = new ContentValues();
                        done.put(MediaStore.Images.Media.IS_PENDING, 0);
                        getContentResolver().update(uri, done, null, null);
                    } catch (Exception e) {
                        getContentResolver().delete(uri, null, null);
                        throw e;
                    }
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Đã lưu vào Ảnh / Artio", Toast.LENGTH_LONG).show());
                } catch (OutOfMemoryError e) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, OUT_OF_MEMORY, Toast.LENGTH_LONG).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Lưu ảnh thất bại: " + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }
    }

    /**
     * Saves files for the web app (Android 10+). Each method returns JSON:
     * {"ok":true,"location":"Tải xuống/Artio","uri":"content://media/..."} or {"ok":false,"error":"..."}.
     * The uri is what "Chia sẻ" sends to other apps. Runs on the WebView bridge thread, so blocking I/O is fine.
     */
    public class FileSaver {
        /** Any file (PDF, .zunva, JSON) → Download/Artio. */
        @JavascriptInterface
        public String saveBytes(String fileName, String mimeType, String base64) {
            return saveInto(MediaStore.Downloads.EXTERNAL_CONTENT_URI, Environment.DIRECTORY_DOWNLOADS + "/Artio", "Tải xuống/Artio", fileName, mimeType, base64);
        }

        /** G3: exported PNG/JPG → Pictures/Artio (shows in the gallery). */
        @JavascriptInterface
        public String saveImageBytes(String fileName, String mimeType, String base64) {
            String mime = safeMimeType(mimeType);
            if (!mime.startsWith("image/")) return error("Chỉ lưu được ảnh vào Thư viện ảnh.");
            return saveInto(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Environment.DIRECTORY_PICTURES + "/Artio", "Ảnh/Artio", fileName, mime, base64);
        }

        private String saveInto(Uri collection, String relativePath, String location, String fileName, String mimeType, String base64) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                return error("Cần Android 10 trở lên để lưu file.");
            }
            if (base64 == null || base64.isEmpty()) return error("Không có dữ liệu để lưu.");
            // Base64 is ~4/3 of the real size: reject huge input before decoding into memory.
            if ((long) base64.length() * 3 / 4 > MAX_SAVE_BYTES) return error(TOO_LARGE);
            byte[] bytes;
            try {
                bytes = Base64.decode(base64, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                return error("Dữ liệu file không hợp lệ.");
            } catch (OutOfMemoryError e) {
                return error(OUT_OF_MEMORY);
            }
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeFileName(fileName));
            values.put(MediaStore.MediaColumns.MIME_TYPE, safeMimeType(mimeType));
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri uri;
            try {
                uri = getContentResolver().insert(collection, values);
            } catch (Exception e) {
                return error("Không tạo được file trong " + location + ".");
            }
            if (uri == null) return error("Không tạo được file trong " + location + ".");
            try {
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IOException("no stream");
                    out.write(bytes);
                }
                ContentValues done = new ContentValues();
                done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContentResolver().update(uri, done, null, null);
            } catch (Exception | OutOfMemoryError e) {
                try { getContentResolver().delete(uri, null, null); } catch (Exception ignored) {}
                return error(e instanceof OutOfMemoryError ? OUT_OF_MEMORY : "Không ghi được file. Có thể máy đã hết chỗ lưu.");
            }
            return ok(location, uri.toString());
        }
    }

    /**
     * G3: "Chia sẻ" — opens the system share sheet (Zalo, Messenger…) for files this app just saved.
     * Only content://media/ uris (what FileSaver returns) are accepted.
     */
    public class ShareBridge {
        @JavascriptInterface
        public String share(String urisJson, String mimeType) {
            ArrayList<Uri> uris = new ArrayList<>();
            try {
                JSONArray list = new JSONArray(urisJson);
                for (int i = 0; i < list.length() && i < 50; i++) {
                    Uri u = Uri.parse(list.getString(i));
                    if (!"content".equals(u.getScheme()) || !"media".equals(u.getAuthority())) return error("File không chia sẻ được.");
                    uris.add(u);
                }
            } catch (JSONException e) {
                return error("File không chia sẻ được.");
            }
            if (uris.isEmpty()) return error("Chưa có file để chia sẻ.");
            Intent send = new Intent(uris.size() == 1 ? Intent.ACTION_SEND : Intent.ACTION_SEND_MULTIPLE);
            send.setType(safeMimeType(mimeType));
            if (uris.size() == 1) send.putExtra(Intent.EXTRA_STREAM, uris.get(0));
            else send.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "Chia sẻ");
            runOnUiThread(() -> {
                try {
                    startActivity(chooser);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Máy không có ứng dụng để chia sẻ.", Toast.LENGTH_LONG).show();
                }
            });
            return ok("", null);
        }
    }

    /** Keeps letters (incl. Vietnamese), digits and common punctuation; blocks path separators. */
    static String safeFileName(String fileName) {
        String name = fileName == null ? "" : fileName.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
        while (name.startsWith(".")) name = name.substring(1);
        if (name.isEmpty()) name = "artio-file";
        if (name.length() > 120) name = name.substring(name.length() - 120);
        return name;
    }

    static String safeMimeType(String mimeType) {
        if (mimeType != null && mimeType.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")) return mimeType.toLowerCase(Locale.ROOT);
        return "application/octet-stream";
    }

    private static String ok(String location, String uri) {
        try {
            JSONObject o = new JSONObject().put("ok", true).put("location", location);
            if (uri != null) o.put("uri", uri);
            return o.toString();
        } catch (JSONException e) {
            return "{\"ok\":true}";
        }
    }

    private static String error(String message) {
        try {
            return new JSONObject().put("ok", false).put("error", message).toString();
        } catch (JSONException e) {
            return "{\"ok\":false}";
        }
    }

    /**
     * Maps a request path to a file inside the APK assets (the Vite build of zunva/apps/web).
     * Returns null when the path is not allowed. "/" or a path without extension → index.html.
     */
    static String assetName(String path) {
        if (path == null) return null;
        String name = path.startsWith("/assets/") ? path.substring(8) : path.startsWith("/") ? path.substring(1) : path;
        if (name.contains("..") || name.contains("\\") || name.contains("//") || name.startsWith("/") || name.indexOf('\0') >= 0) return null;
        if (name.isEmpty() || name.endsWith("/")) return name + "index.html";
        String last = name.substring(name.lastIndexOf('/') + 1);
        if (last.indexOf('.') < 0) return "index.html";
        return name;
    }

    /** MIME type by extension; null = not served. */
    static String mimeFor(String name) {
        String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        switch (ext) {
            case "html": return "text/html";
            case "js": return "application/javascript";
            case "css": return "text/css";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            case "woff2": return "font/woff2";
            case "woff": return "font/woff";
            case "ttf": return "font/ttf";
            case "otf": return "font/otf";
            case "gif": return "image/gif";
            case "avif": return "image/avif";
            case "mjs": return "application/javascript";
            case "txt": return "text/plain";
            case "wasm": return "application/wasm";
            case "json": return "application/json";
            case "ico": return "image/x-icon";
            default: return null;
        }
    }

    private static boolean isText(String mime) {
        return mime.startsWith("text/") || mime.equals("application/javascript") || mime.equals("application/json") || mime.equals("image/svg+xml");
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Chỉ bản kiểm tra (dựng với -PartioWebViewDebug=true) mới cho máy tính điều khiển qua USB.
        if (BuildConfig.WEBVIEW_DEBUG) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#e8f3fb"));
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // Android 15 (targetSdk 35) luôn vẽ tràn viền: thanh trạng thái đè lên chữ "Artio" (founder thử 12/11).
        // Chừa đúng phần thanh hệ thống + tai thỏ; bàn phím vẫn phủ lên như trước.
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(i.left, i.top, i.right, i.bottom);
                return insets;
            });
        }
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(true);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new ImageSaver(), "AndroidImageSaver");
        web.addJavascriptInterface(new FileSaver(), "AndroidFileSaver");
        web.addJavascriptInterface(new ShellBridge(), "AndroidShell");
        web.addJavascriptInterface(new ShareBridge(), "AndroidShare");
        web.addJavascriptInterface(new SubjectBridge(this, web), "AndroidSubject");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String name = assetName(u.getPath());
                if (name == null) return notFound();
                String mime = mimeFor(name);
                if (mime == null) return notFound();
                try {
                    InputStream in = getAssets().open(name);
                    return new WebResourceResponse(mime, isText(mime) ? "UTF-8" : null, in);
                } catch (IOException e) {
                    return notFound();
                }
            }
            private WebResourceResponse notFound() {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new java.io.ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if (HOST.equals(uri.getHost())) return false;
                if (req.isForMainFrame()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                    return true;
                }
                return false;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); return true; }
                catch (Exception e) { chooser = null; return false; }
            }
        });
        web.loadUrl(HOME);
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && chooser != null) {
            chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            chooser = null;
        }
    }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
