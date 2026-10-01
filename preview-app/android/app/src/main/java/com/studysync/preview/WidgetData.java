package com.studysync.preview;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * ウィジェット共通: アプリが保存したデータ(WidgetBridgePlugin)の読み込み、まとめて更新、
 * 次の切り替わり(予定の開始・終了、日付の変わり目)での自動更新、グラフの描画。
 */
final class WidgetData {

    static final String PREFS = "studysync_widget";
    static final String KEY_DAYS = "days";
    static final String ACTION_TICK = "com.studysync.WIDGET_TICK";
    static final String[] WEEK = { "日", "月", "火", "水", "木", "金", "土" };
    static final int SILVER = 0xFFEEF1F6, DIM = 0xFF8C95A6, TEAL = 0xFF4FC3E0, LATE = 0xFFE88A8A, DONE = 0xFF6B7385;

    @SuppressWarnings("unchecked")
    private static final Class<? extends BaseWidgetProvider>[] PROVIDERS = new Class[] {
        TaskWidgetProvider.class, NextWidgetProvider.class, ProgressWidgetProvider.class, WeekWidgetProvider.class,
    };

    private WidgetData() {}

    static final class Item {
        int start, dur, color;
        String title, initial;
        boolean review, done;
    }

    /** ある時点のデータ。today が null = 今日の分がない(アプリをしばらく開いていない) */
    static final class Snapshot {
        Calendar now;
        int nowMin;
        List<Item> today;
        List<Item> pool = new ArrayList<>();
        int[] week = new int[7]; // 6日前〜今日の勉強時間(分)

        int total() { return today == null ? 0 : today.size(); }
        int done() { int n = 0; if (today != null) for (Item it : today) if (it.done) n++; return n; }
        int reviewsLeft() { int n = 0; if (today != null) for (Item it : today) if (it.review && !it.done) n++; return n; }

        /** 進行中 → これから → 時間を過ぎた未完了、の順で最初の1件 */
        Item next() {
            if (today == null) return null;
            Item upcoming = null, late = null;
            for (Item it : today) {
                if (it.done) continue;
                if (it.start <= nowMin && nowMin < it.start + it.dur) return it;
                if (it.start > nowMin) { if (upcoming == null) upcoming = it; }
                else if (late == null) late = it;
            }
            return upcoming != null ? upcoming : late;
        }
    }

    static String key(Calendar c) {
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    static String dateLabel(Calendar c) {
        return (c.get(Calendar.MONTH) + 1) + "/" + c.get(Calendar.DAY_OF_MONTH) + "(" + WEEK[c.get(Calendar.DAY_OF_WEEK) - 1] + ")";
    }

    static String time(int min) {
        return String.format(Locale.US, "%d:%02d", min / 60, min % 60);
    }

    /** 12分 / 1時間20分 */
    static String duration(int min) {
        if (min < 60) return min + "分";
        return (min / 60) + "時間" + (min % 60 == 0 ? "" : (min % 60) + "分");
    }

    private static Item parse(JSONObject o) {
        Item it = new Item();
        it.start = o.optInt("s");
        it.dur = o.optInt("d");
        it.title = o.optString("t");
        it.initial = o.optString("n", it.title.isEmpty() ? "?" : it.title.substring(0, 1));
        it.review = o.optInt("r") == 1;
        it.done = o.optInt("x") == 1;
        try { it.color = Color.parseColor(o.optString("c", "#8892A2")); } catch (IllegalArgumentException e) { it.color = 0xFF8892A2; }
        return it;
    }

    static Snapshot load(Context context) {
        Snapshot s = new Snapshot();
        s.now = Calendar.getInstance();
        s.nowMin = s.now.get(Calendar.HOUR_OF_DAY) * 60 + s.now.get(Calendar.MINUTE);
        try {
            JSONObject root = new JSONObject(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DAYS, "{}"));
            JSONArray arr = root.optJSONArray(key(s.now));
            if (arr != null) {
                // 未完了を開始時刻順、その後に完了済み
                List<Item> open = new ArrayList<>(), done = new ArrayList<>();
                for (int i = 0; i < arr.length(); i++) { Item it = parse(arr.getJSONObject(i)); (it.done ? done : open).add(it); }
                open.addAll(done);
                s.today = open;
            }
            JSONArray pool = root.optJSONArray("pool");
            if (pool != null) for (int i = 0; i < pool.length(); i++) s.pool.add(parse(pool.getJSONObject(i)));
            JSONObject week = root.optJSONObject("week");
            if (week != null) {
                Calendar d = (Calendar) s.now.clone();
                for (int i = 6; i >= 0; i--) { s.week[i] = week.optInt(key(d)); d.add(Calendar.DAY_OF_MONTH, -1); }
            }
        } catch (Exception ignored) { /* 読めなければ空のまま */ }
        return s;
    }

    /** 教科の色の上に載せる文字色(明るい色には濃い文字) */
    static int inkOn(int color) {
        double l = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
        return l > 0.66 ? 0xFF1C1F26 : 0xFFFFFFFF;
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        for (Class<? extends BaseWidgetProvider> cls : PROVIDERS) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, cls));
            if (ids.length == 0) continue;
            try { cls.newInstance().onUpdate(context, manager, ids); } catch (Exception ignored) { }
        }
    }

    /** 予定の開始・終了や日付の変わり目で表示を切り替えるため、次のその時刻に更新を予約する(端末を起こさない) */
    static void scheduleTick(Context context, Snapshot s) {
        int next = 24 * 60; // 日付の変わり目
        if (s.today != null) for (Item it : s.today) {
            if (it.start > s.nowMin) next = Math.min(next, it.start);
            if (it.start + it.dur > s.nowMin) next = Math.min(next, it.start + it.dur);
        }
        Calendar at = (Calendar) s.now.clone();
        at.set(Calendar.HOUR_OF_DAY, 0); at.set(Calendar.MINUTE, 0); at.set(Calendar.SECOND, 5); at.set(Calendar.MILLISECOND, 0);
        at.add(Calendar.MINUTE, next);
        Intent intent = new Intent(context, TaskWidgetProvider.class).setAction(ACTION_TICK);
        PendingIntent pi = PendingIntent.getBroadcast(context, 7, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.RTC, at.getTimeInMillis(), pi);
    }

    /** ウィジェットの今の大きさ(dp)。取れなければ fallback */
    static int[] sizeDp(AppWidgetManager manager, int id, int fw, int fh) {
        Bundle o = manager.getAppWidgetOptions(id);
        int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        return new int[] { w > 0 ? w : fw, h > 0 ? h : fh };
    }

    /** 進み具合のリング */
    static Bitmap ring(Context context, int sizeDp, float fraction) {
        float d = context.getResources().getDisplayMetrics().density;
        int px = Math.max(1, Math.round(sizeDp * d));
        Bitmap bmp = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        float stroke = 8 * d, inset = stroke / 2 + d;
        RectF r = new RectF(inset, inset, px - inset, px - inset);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(stroke);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setColor(0x26FFFFFF);
        c.drawArc(r, 0, 360, false, p);
        if (fraction > 0) {
            p.setColor(TEAL);
            c.drawArc(r, -90, Math.max(2, 360 * Math.min(1, fraction)), false, p);
        }
        return bmp;
    }

    /** 今週の勉強時間の棒グラフ(6日前〜今日)。今日の棒はティール */
    static Bitmap weekChart(Context context, int wDp, int hDp, int[] minutes, Calendar today) {
        float d = context.getResources().getDisplayMetrics().density;
        int w = Math.max(1, Math.round(wDp * d)), h = Math.max(1, Math.round(hDp * d));
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
        text.setTextAlign(Paint.Align.CENTER);
        text.setTextSize(11 * d);
        Paint bar = new Paint(Paint.ANTI_ALIAS_FLAG);

        float labelH = 16 * d, valueH = 14 * d;
        float chartTop = valueH, chartBottom = h - labelH - 4 * d;
        float slot = w / 7f, bw = Math.min(slot * 0.5f, 22 * d);
        int max = 60;
        for (int m : minutes) max = Math.max(max, m);
        Calendar day = (Calendar) today.clone();
        day.add(Calendar.DAY_OF_MONTH, -6);
        for (int i = 0; i < 7; i++) {
            boolean isToday = i == 6;
            float cx = slot * i + slot / 2;
            float bh = (chartBottom - chartTop) * minutes[i] / max;
            bar.setColor(isToday ? TEAL : 0x8CC7CDD9);
            if (minutes[i] > 0) {
                bh = Math.max(bh, 4 * d);
                c.drawRoundRect(new RectF(cx - bw / 2, chartBottom - bh, cx + bw / 2, chartBottom), 4 * d, 4 * d, bar);
                text.setColor(isToday ? TEAL : DIM);
                text.setFakeBoldText(isToday);
                String v = minutes[i] >= 60 ? String.format(Locale.US, "%.1fh", minutes[i] / 60f) : minutes[i] + "分";
                c.drawText(v, cx, chartBottom - bh - 4 * d, text);
            } else {
                bar.setColor(0x26FFFFFF);
                c.drawRoundRect(new RectF(cx - bw / 2, chartBottom - 3 * d, cx + bw / 2, chartBottom), 2 * d, 2 * d, bar);
            }
            text.setColor(isToday ? TEAL : DIM);
            text.setFakeBoldText(isToday);
            c.drawText(isToday ? "今日" : WEEK[day.get(Calendar.DAY_OF_WEEK) - 1], cx, h - 4 * d, text);
            day.add(Calendar.DAY_OF_MONTH, 1);
        }
        return bmp;
    }
}
