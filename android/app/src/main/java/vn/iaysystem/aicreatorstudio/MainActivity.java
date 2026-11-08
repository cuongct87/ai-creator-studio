package vn.iaysystem.aicreatorstudio;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.ContentValues;
import android.webkit.*;
import android.widget.Toast;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.content.pm.ApplicationInfo;
import android.util.Base64;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;

public class MainActivity extends Activity {
    private WebView web;
    private TextView startupStatus;
    private boolean isTestBuild;

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
    private ValueCallback<Uri[]> chooser;
    private static final int PICK_FILE = 100;
    private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";

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
                    String safeName = fileName == null ? "ai-creator-studio" : fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
                    if (!safeName.endsWith(ext)) safeName = "ai-creator-studio" + ext;
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                        throw new IOException("Android 10+ required for direct gallery save");
                    }
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Images.Media.MIME_TYPE, mime);
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/AICreatorStudio");
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
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Đã lưu vào Ảnh / AICreatorStudio", Toast.LENGTH_LONG).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Lưu ảnh thất bại: " + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        isTestBuild = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        web = new WebView(this);
        if (isTestBuild) {
            // Native label is independent of HTML and JavaScript. It identifies which APK was opened.
            LinearLayout shell = new LinearLayout(this);
            shell.setOrientation(LinearLayout.VERTICAL);
            startupStatus = new TextView(this);
            startupStatus.setText("ZUNVA 2.2 TEST · Đang kiểm tra Studio...");
            startupStatus.setTextSize(11);
            startupStatus.setTextColor(Color.WHITE);
            startupStatus.setBackgroundColor(Color.rgb(12, 82, 106));
            startupStatus.setPadding(dp(12), dp(7), dp(12), dp(7));
            shell.addView(startupStatus, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
            shell.addView(web, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
            setContentView(shell);
            // Test builds should never quietly display a cached old page.
            web.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            web.clearCache(true);
        } else {
            setContentView(web);
        }
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(true);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new ImageSaver(), "AndroidImageSaver");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!"appassets.androidplatform.net".equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || !p.startsWith("/assets/")) return notFound();
                String name = p.substring(8);
                if (!(name.equals("index.html") || name.equals("script.js") || name.equals("studio_v15.js") || name.equals("style.css") || name.equals("vault_i18n.js"))) return notFound();
                String mime = name.endsWith(".html") ? "text/html" : name.endsWith(".css") ? "text/css" : "application/javascript";
                try { return new WebResourceResponse(mime, "UTF-8", getAssets().open(name)); }
                catch (IOException e) { return notFound(); }
            }
            private WebResourceResponse notFound() {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new java.io.ByteArrayInputStream(new byte[0]));
            }
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (isTestBuild && startupStatus != null && url != null && url.startsWith(HOME)) {
                    // Verify the actual WebView DOM, not merely that APK files were packaged.
                    view.evaluateJavascript(
                        "(function(){return !!(document.getElementById('navZunva') && document.getElementById('zunva') && document.getElementById('z-start-blank'));})()",
                        result -> {
                            if ("true".equals(result)) {
                                startupStatus.setText("ZUNVA 2.2 TEST · Studio đã tải ✓");
                                startupStatus.setBackgroundColor(Color.rgb(16, 93, 87));
                            } else {
                                startupStatus.setText("ZUNVA 2.2 TEST · LỖI: Giao diện Studio không tải");
                                startupStatus.setBackgroundColor(Color.rgb(147, 42, 37));
                            }
                        });
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if ("appassets.androidplatform.net".equals(uri.getHost())) return false;
                if (req.isForMainFrame()) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch(Exception ignored) {}
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
