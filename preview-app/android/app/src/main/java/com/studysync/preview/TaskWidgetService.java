package com.studysync.preview;

import android.content.Context;
import android.content.Intent;
import android.graphics.Paint;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;

/**
 * ウィジェット「今日の予定」の一覧(スクロールできる)の各行を作る。
 * 今日の予定(未完了 → 完了済み)のあとに、「未設定」の見出しと時間軸にまだ置いていないタスクを並べる。
 */
public class TaskWidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    /** 一覧の1行。item が null なら見出し(または案内文) */
    private static final class Entry {
        final WidgetData.Item item; final String text; final boolean pool;
        Entry(WidgetData.Item item, String text, boolean pool) { this.item = item; this.text = text; this.pool = pool; }
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
            WidgetData.Snapshot s = WidgetData.load(context);
            nowMin = s.nowMin;
            if (s.today != null) for (WidgetData.Item it : s.today) entries.add(new Entry(it, null, false));
            if (!s.pool.isEmpty()) {
                // 今日の予定がないときは、上の空欄の案内の代わりに一覧の中で伝える
                if (s.today == null) entries.add(new Entry(null, "アプリを開くと今日の予定が表示されます", false));
                else if (s.today.isEmpty()) entries.add(new Entry(null, "今日の予定はありません", false));
                entries.add(new Entry(null, "未設定 " + s.pool.size() + "件", true));
                for (WidgetData.Item it : s.pool) entries.add(new Entry(it, null, true));
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
                h.setTextColor(R.id.w_section, e.pool ? WidgetData.TEAL : WidgetData.DIM);
                h.setOnClickFillInIntent(R.id.w_section, new Intent());
                return h;
            }
            WidgetData.Item it = e.item;
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_row);
            boolean active = !e.pool && !it.done && it.start <= nowMin && nowMin < it.start + it.dur;
            boolean late = !e.pool && !it.done && nowMin >= it.start + it.dur;
            if (e.pool) {
                v.setTextViewText(R.id.w_time, it.dur > 0 ? it.dur + "分" : "");
                v.setTextColor(R.id.w_time, WidgetData.DIM);
            } else {
                v.setTextViewText(R.id.w_time, WidgetData.time(it.start));
                v.setTextColor(R.id.w_time, active ? WidgetData.TEAL : late ? WidgetData.LATE : WidgetData.DIM);
            }
            // 教科の頭文字(教科の色の四角)
            v.setInt(R.id.w_avatar_bg, "setColorFilter", it.color);
            v.setInt(R.id.w_avatar_bg, "setImageAlpha", it.done ? 90 : 255);
            v.setTextViewText(R.id.w_avatar, it.initial);
            v.setTextColor(R.id.w_avatar, it.done ? 0x99FFFFFF : WidgetData.inkOn(it.color));
            v.setTextViewText(R.id.w_title, it.title);
            v.setTextColor(R.id.w_title, it.done ? WidgetData.DONE : WidgetData.SILVER);
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
