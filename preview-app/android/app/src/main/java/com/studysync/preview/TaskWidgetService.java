package com.studysync.preview;

import android.content.Context;
import android.content.Intent;
import android.graphics.Paint;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * ウィジェットの一覧(スクロールできる)の各行を作る。
 * 今日の予定(未完了 → 完了済み)のあとに、「未設定」の見出しと時間軸にまだ置いていないタスクを並べる。
 */
public class TaskWidgetService extends RemoteViewsService {

    private static final int DIM = 0xFF8C95A6, TEAL = 0xFF4FC3E0, LATE = 0xFFE88A8A, TITLE = 0xFFEEF1F6, DONE = 0xFF6B7385;

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    /** 一覧の1行。item が null なら見出し(または案内文) */
    private static final class Entry {
        final TaskWidgetProvider.Item item; final String text; final boolean pool;
        Entry(TaskWidgetProvider.Item item, String text, boolean pool) { this.item = item; this.text = text; this.pool = pool; }
    }

    private static final class Factory implements RemoteViewsFactory {
        private final Context context;
        private final List<Entry> entries = new ArrayList<>();
        private int nowMin;

        Factory(Context context) { this.context = context; }

        @Override public void onCreate() {}
        @Override public void onDestroy() {}

        @Override
        public void onDataSetChanged() {
            entries.clear();
            nowMin = TaskWidgetProvider.nowMinute();
            List<TaskWidgetProvider.Item> today = TaskWidgetProvider.loadToday(context);
            List<TaskWidgetProvider.Item> pool = TaskWidgetProvider.loadPool(context);
            if (today != null) for (TaskWidgetProvider.Item it : today) entries.add(new Entry(it, null, false));
            if (!pool.isEmpty()) {
                // 今日の予定がないときは、上の空欄の案内の代わりに一覧の中で伝える
                if (today == null) entries.add(new Entry(null, "アプリを開くと今日の予定が表示されます", false));
                else if (today.isEmpty()) entries.add(new Entry(null, "今日の予定はありません", false));
                entries.add(new Entry(null, "未設定 " + pool.size() + "件", true));
                for (TaskWidgetProvider.Item it : pool) entries.add(new Entry(it, null, true));
            }
        }

        @Override public int getCount() { return entries.size(); }

        @Override
        public RemoteViews getViewAt(int position) {
            if (position >= entries.size()) return new RemoteViews(context.getPackageName(), R.layout.widget_row);
            Entry e = entries.get(position);
            if (e.item == null) {
                RemoteViews h = new RemoteViews(context.getPackageName(), R.layout.widget_section);
                h.setTextViewText(R.id.w_section, e.text);
                h.setTextColor(R.id.w_section, e.pool ? TEAL : DIM);
                h.setOnClickFillInIntent(R.id.w_section, new Intent());
                return h;
            }
            TaskWidgetProvider.Item it = e.item;
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_row);
            if (e.pool) {
                v.setTextViewText(R.id.w_time, it.dur > 0 ? it.dur + "分" : "");
                v.setTextColor(R.id.w_time, DIM);
            } else {
                boolean active = !it.done && it.start <= nowMin && nowMin < it.start + it.dur;
                boolean late = !it.done && nowMin >= it.start + it.dur;
                v.setTextViewText(R.id.w_time, String.format(Locale.US, "%d:%02d", it.start / 60, it.start % 60));
                v.setTextColor(R.id.w_time, active ? TEAL : late ? LATE : DIM);
            }
            boolean active = !e.pool && !it.done && it.start <= nowMin && nowMin < it.start + it.dur;
            v.setInt(R.id.w_bar, "setColorFilter", it.color);
            v.setInt(R.id.w_bar, "setImageAlpha", it.done ? 90 : 255);
            v.setTextViewText(R.id.w_title, it.title);
            v.setTextColor(R.id.w_title, it.done ? DONE : TITLE);
            v.setInt(R.id.w_title, "setPaintFlags", it.done ? Paint.STRIKE_THRU_TEXT_FLAG | Paint.ANTI_ALIAS_FLAG : Paint.ANTI_ALIAS_FLAG);
            String tag = it.done ? "完了" : active ? "進行中" : it.review ? "復習" : "";
            v.setTextViewText(R.id.w_tag, tag);
            v.setViewVisibility(R.id.w_tag, tag.isEmpty() ? View.GONE : View.VISIBLE);
            v.setOnClickFillInIntent(R.id.w_row, new Intent());
            return v;
        }

        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 2; }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean hasStableIds() { return false; }
    }
}
