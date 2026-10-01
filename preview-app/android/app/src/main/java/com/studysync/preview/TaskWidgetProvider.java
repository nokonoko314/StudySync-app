package com.studysync.preview;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * ホーム画面ウィジェット「今日の予定」。
 * アプリが保存した今日と明日の予定(WidgetBridgePlugin)を読み、今日の予定をスクロールできる一覧で表示する。
 * 明日の分も受け取っているので、日付が変わってもアプリを開かずに切り替わる。
 */
public class TaskWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "studysync_widget";
    static final String KEY_DAYS = "days";
    private static final String[] WEEK = { "日", "月", "火", "水", "木", "金", "土" };

    static final class Item {
        int start, dur, color;
        String title;
        boolean review, done;
    }

    /** 今日の予定(未完了を開始時刻順、その後に完了済み)。今日の分がなければ null = アプリをしばらく開いていない */
    static List<Item> loadToday(Context context) {
        Calendar now = Calendar.getInstance();
        String key = String.format(Locale.US, "%04d-%02d-%02d",
            now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
        try {
            String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DAYS, "{}");
            JSONArray arr = new JSONObject(raw).optJSONArray(key);
            if (arr == null) return null;
            List<Item> open = new ArrayList<>(), done = new ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                Item it = new Item();
                it.start = o.optInt("s");
                it.dur = o.optInt("d");
                it.title = o.optString("t");
                it.review = o.optInt("r") == 1;
                it.done = o.optInt("x") == 1;
                try { it.color = Color.parseColor(o.optString("c", "#8892A2")); } catch (IllegalArgumentException e) { it.color = 0xFF8892A2; }
                (it.done ? done : open).add(it);
            }
            open.addAll(done);
            return open;
        } catch (Exception e) {
            return null;
        }
    }

    /** 時間軸にまだ置いていないタスク(未設定) */
    static List<Item> loadPool(Context context) {
        List<Item> list = new ArrayList<>();
        try {
            String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DAYS, "{}");
            JSONArray arr = new JSONObject(raw).optJSONArray("pool");
            if (arr == null) return list;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                Item it = new Item();
                it.dur = o.optInt("d");
                it.title = o.optString("t");
                try { it.color = Color.parseColor(o.optString("c", "#8892A2")); } catch (IllegalArgumentException e) { it.color = 0xFF8892A2; }
                list.add(it);
            }
        } catch (Exception ignored) { /* 読めなければ表示しない */ }
        return list;
    }

    static int nowMinute() {
        Calendar now = Calendar.getInstance();
        return now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TaskWidgetProvider.class));
        if (ids.length == 0) return;
        new TaskWidgetProvider().onUpdate(context, manager, ids);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        Calendar now = Calendar.getInstance();
        List<Item> items = loadToday(context);
        int total = items == null ? 0 : items.size(), done = 0;
        if (items != null) for (Item it : items) if (it.done) done++;

        String empty;
        if (items == null) empty = "アプリを開くと今日の予定が表示されます";
        else if (total == 0) empty = "今日の予定はありません";
        else empty = "";

        Intent launch = new Intent(context, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // 一覧の行のタップは MUTABLE でないと fill-in が効かない(行ごとの中身は同じなので実害はない)
        PendingIntent open = PendingIntent.getActivity(context, 0, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent template = PendingIntent.getActivity(context, 1, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task);
            v.setTextViewText(R.id.w_date, "今日 " + (now.get(Calendar.MONTH) + 1) + "/" + now.get(Calendar.DAY_OF_MONTH)
                + "(" + WEEK[now.get(Calendar.DAY_OF_WEEK) - 1] + ")");
            v.setTextViewText(R.id.w_count, total == 0 ? "" : done + " / " + total + " 完了");
            v.setProgressBar(R.id.w_progress, Math.max(total, 1), done, false);
            v.setViewVisibility(R.id.w_progress, total == 0 ? View.GONE : View.VISIBLE);

            Intent svc = new Intent(context, TaskWidgetService.class)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
            v.setRemoteAdapter(R.id.w_list, svc);
            v.setEmptyView(R.id.w_list, R.id.w_empty);
            v.setTextViewText(R.id.w_empty, empty);
            v.setPendingIntentTemplate(R.id.w_list, template);
            v.setOnClickPendingIntent(R.id.w_root, open);
            manager.updateAppWidget(id, v);
        }
        manager.notifyAppWidgetViewDataChanged(ids, R.id.w_list);
    }
}
