package com.studysync.preview;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
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
 * アプリが保存した今日と明日の予定(WidgetBridgePlugin)を読み、未完了の予定を開始時刻順に表示する。
 * 明日の分も受け取っているので、日付が変わってもアプリを開かずに切り替わる。
 */
public class TaskWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "studysync_widget";
    static final String KEY_DAYS = "days";
    private static final int[][] ROWS = {
        { R.id.w_row1, R.id.w_time1, R.id.w_bar1, R.id.w_title1, R.id.w_tag1 },
        { R.id.w_row2, R.id.w_time2, R.id.w_bar2, R.id.w_title2, R.id.w_tag2 },
        { R.id.w_row3, R.id.w_time3, R.id.w_bar3, R.id.w_title3, R.id.w_tag3 },
    };
    private static final String[] WEEK = { "日", "月", "火", "水", "木", "金", "土" };
    private static final int DIM = 0xFF8C95A6, TEAL = 0xFF4FC3E0, LATE = 0xFFE88A8A;

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TaskWidgetProvider.class));
        if (ids.length > 0) new TaskWidgetProvider().onUpdate(context, manager, ids);
    }

    private static final class Item {
        int start, dur, color;
        String title;
        boolean review, done;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        Calendar now = Calendar.getInstance();
        String key = String.format(Locale.US, "%04d-%02d-%02d",
            now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
        int nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        // 今日の分がない = アプリをしばらく開いていない(予定がない日も空の配列が入る)
        List<Item> items = null;
        try {
            String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DAYS, "{}");
            JSONArray arr = new JSONObject(raw).optJSONArray(key);
            if (arr != null) {
                items = new ArrayList<>();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject o = arr.getJSONObject(i);
                    Item it = new Item();
                    it.start = o.optInt("s");
                    it.dur = o.optInt("d");
                    it.title = o.optString("t");
                    it.review = o.optInt("r") == 1;
                    it.done = o.optInt("x") == 1;
                    try { it.color = Color.parseColor(o.optString("c", "#8892A2")); } catch (IllegalArgumentException e) { it.color = DIM; }
                    items.add(it);
                }
            }
        } catch (Exception ignored) {
            items = null;
        }

        int total = items == null ? 0 : items.size(), done = 0;
        List<Item> open = new ArrayList<>();
        if (items != null) for (Item it : items) { if (it.done) done++; else open.add(it); }

        for (int id : ids) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task);
            v.setTextViewText(R.id.w_date, "今日 " + (now.get(Calendar.MONTH) + 1) + "/" + now.get(Calendar.DAY_OF_MONTH)
                + "(" + WEEK[now.get(Calendar.DAY_OF_WEEK) - 1] + ")");
            v.setTextViewText(R.id.w_count, total == 0 ? "" : done + " / " + total + " 完了");
            v.setProgressBar(R.id.w_progress, Math.max(total, 1), done, false);
            v.setViewVisibility(R.id.w_progress, total == 0 ? View.GONE : View.VISIBLE);

            for (int i = 0; i < ROWS.length; i++) {
                int[] r = ROWS[i];
                if (i >= open.size()) { v.setViewVisibility(r[0], View.GONE); continue; }
                Item it = open.get(i);
                boolean active = it.start <= nowMin && nowMin < it.start + it.dur;
                boolean late = nowMin >= it.start + it.dur;
                v.setViewVisibility(r[0], View.VISIBLE);
                v.setTextViewText(r[1], String.format(Locale.US, "%d:%02d", it.start / 60, it.start % 60));
                v.setTextColor(r[1], active ? TEAL : late ? LATE : DIM);
                v.setInt(r[2], "setColorFilter", it.color);
                v.setTextViewText(r[3], it.title);
                v.setTextViewText(r[4], active ? "進行中" : it.review ? "復習" : "");
                v.setViewVisibility(r[4], active || it.review ? View.VISIBLE : View.GONE);
            }

            String empty = null;
            if (items == null) empty = "アプリを開くと今日の予定が表示されます";
            else if (total == 0) empty = "今日の予定はありません";
            else if (open.isEmpty()) empty = "今日の予定はすべて完了しました";
            v.setViewVisibility(R.id.w_empty, empty == null ? View.GONE : View.VISIBLE);
            v.setTextViewText(R.id.w_empty, empty == null ? "" : empty);
            int more = open.size() - ROWS.length;
            v.setViewVisibility(R.id.w_more, more > 0 ? View.VISIBLE : View.GONE);
            v.setTextViewText(R.id.w_more, "ほか " + more + " 件");

            Intent launch = new Intent(context, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            manager.updateAppWidget(id, v);
        }
    }
}
