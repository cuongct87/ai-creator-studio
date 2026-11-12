package vn.iaysystem.aicreatorstudio;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.common.MlKitException;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentationResult;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter;
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.FloatBuffer;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * G2b — tách nền bằng ML Kit Subject Segmentation (chạy trên máy, ảnh không gửi ra ngoài).
 *
 * JS gọi: window.AndroidSubject.segment(requestId, base64Ảnh)  — trả ngay, xử lý ở luồng riêng.
 * Java trả: window.__artioSegmentDone(requestId, json)
 *   {"ok":true,"mask":"<base64 PNG>"}  mặt nạ theo độ trong suốt (đục = chủ thể), cùng tỉ lệ ảnh đã xoay theo EXIF
 *   {"ok":true,"mask":null}             không thấy chủ thể
 *   {"ok":false,"error":"..."}          câu báo tiếng Việt
 */
final class SubjectBridge {
    /** Khớp ANDROID_MAX_SEGMENT_BYTES bên TypeScript. */
    private static final int MAX_INPUT_BYTES = 40 * 1024 * 1024;
    /** Cạnh dài mặt nạ: đủ mịn trên điện thoại, file nhỏ. */
    private static final int MAX_SIDE = 1024;
    private static final String ID_PATTERN = "[A-Za-z0-9_-]{1,64}";

    private final Activity activity;
    private final WebView web;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private SubjectSegmenter segmenter;

    SubjectBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
    }

    @JavascriptInterface
    public void segment(String requestId, String base64) {
        if (requestId == null || !requestId.matches(ID_PATTERN) || base64 == null) return;
        worker.execute(() -> reply(requestId, run(base64)));
    }

    private synchronized SubjectSegmenter segmenter() {
        if (segmenter == null) {
            SubjectSegmenterOptions options = new SubjectSegmenterOptions.Builder().enableForegroundConfidenceMask().build();
            segmenter = SubjectSegmentation.getClient(options);
        }
        return segmenter;
    }

    private String run(String base64) {
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            if (bytes.length > MAX_INPUT_BYTES) return error("Ảnh quá lớn để tách nền (tối đa 40 MB).");
            Bitmap image = decode(bytes);
            if (image == null) return error("Máy không đọc được ảnh này.");
            SubjectSegmentationResult result = Tasks.await(segmenter().process(InputImage.fromBitmap(image, 0)), 60, TimeUnit.SECONDS);
            FloatBuffer confidence = result.getForegroundConfidenceMask();
            int w = image.getWidth();
            int h = image.getHeight();
            image.recycle();
            if (confidence == null) return okNull();
            confidence.rewind();
            int[] pixels = new int[w * h];
            int kept = 0;
            for (int i = 0; i < pixels.length && confidence.hasRemaining(); i++) {
                int alpha = alphaFor(confidence.get());
                if (alpha > 127) kept++;
                // Trắng, độ trong suốt theo mức tin cậy (mép chuyển mềm).
                pixels[i] = (alpha << 24) | 0x00ffffff;
            }
            if (kept < pixels.length / 500) return okNull();
            Bitmap mask = Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            mask.compress(Bitmap.CompressFormat.PNG, 100, out);
            mask.recycle();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("mask", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            return o.toString();
        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof MlKitException && ((MlKitException) cause).getErrorCode() == MlKitException.UNAVAILABLE) {
                return error("Máy đang tải bộ tách nền của Google (cần mạng). Hãy thử lại sau ít phút.");
            }
            return error("Không tách được nền. Hãy thử lại.");
        } catch (TimeoutException e) {
            return error("Tách nền lâu quá. Hãy thử lại.");
        } catch (OutOfMemoryError e) {
            return error("Ảnh quá lớn, bộ nhớ máy không đủ để tách nền.");
        } catch (Exception e) {
            return error("Không tách được nền. Hãy thử lại.");
        }
    }

    /** Độ tin cậy 0..1 → độ đục 0..255, chuyển mềm trong khoảng 0,35–0,65. */
    static int alphaFor(float c) {
        if (c <= 0.35f) return 0;
        if (c >= 0.65f) return 255;
        return Math.round((c - 0.35f) / 0.30f * 255f);
    }

    /** Đọc ảnh, thu về cạnh dài ≤ MAX_SIDE, xoay/lật theo EXIF giống trình duyệt hiển thị. */
    private static Bitmap decode(byte[] bytes) {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null;
        int side = Math.max(bounds.outWidth, bounds.outHeight);
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = 1;
        while (side / (opts.inSampleSize * 2) >= MAX_SIDE) opts.inSampleSize *= 2;
        Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
        if (bmp == null) return null;

        Matrix m = new Matrix();
        float scale = Math.min(1f, (float) MAX_SIDE / Math.max(bmp.getWidth(), bmp.getHeight()));
        m.postScale(scale, scale);
        int orientation = ExifInterface.ORIENTATION_NORMAL;
        try {
            orientation = new ExifInterface(new ByteArrayInputStream(bytes)).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
        } catch (Exception ignored) {
            // PNG/WebP không có EXIF: giữ nguyên.
        }
        switch (orientation) {
            case ExifInterface.ORIENTATION_FLIP_HORIZONTAL: m.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_ROTATE_180: m.postRotate(180); break;
            case ExifInterface.ORIENTATION_FLIP_VERTICAL: m.postScale(1, -1); break;
            case ExifInterface.ORIENTATION_TRANSPOSE: m.postRotate(90); m.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_ROTATE_90: m.postRotate(90); break;
            case ExifInterface.ORIENTATION_TRANSVERSE: m.postRotate(-90); m.postScale(-1, 1); break;
            case ExifInterface.ORIENTATION_ROTATE_270: m.postRotate(-90); break;
            default: break;
        }
        Bitmap out = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
        if (out != bmp) bmp.recycle();
        return out;
    }

    private static String okNull() {
        return "{\"ok\":true,\"mask\":null}";
    }

    private static String error(String message) {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", false);
            o.put("error", message);
            return o.toString();
        } catch (JSONException e) {
            return "{\"ok\":false}";
        }
    }

    private void reply(String requestId, String json) {
        String js = "window.__artioSegmentDone&&window.__artioSegmentDone(" + JSONObject.quote(requestId) + "," + JSONObject.quote(json) + ")";
        activity.runOnUiThread(() -> web.evaluateJavascript(js, null));
    }
}
