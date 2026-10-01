package com.studysync.preview;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

/** ウィジェット「次の予定」(小)。進行中、なければ次の予定を大きく出す */
public class NextWidgetProvider extends BaseWidgetProvider {

    @Override
    RemoteViews build(Context context, AppWidgetManager manager, int id, WidgetData.Snapshot s) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_next);
        int total = s.total(), done = s.done();
        v.setTextViewText(R.id.w_count, total == 0 ? "" : done + "/" + total);
        WidgetData.Item it = s.next();
        if (it == null) {
            v.setViewVisibility(R.id.w_body, View.GONE);
            v.setViewVisibility(R.id.w_empty, View.VISIBLE);
            v.setTextViewText(R.id.w_empty, s.today == null ? "アプリを開くと予定が表示されます"
                : total == 0 ? "今日の予定はありません" : "今日の予定はすべて完了しました");
        } else {
            v.setViewVisibility(R.id.w_body, View.VISIBLE);
            v.setViewVisibility(R.id.w_empty, View.GONE);
            boolean active = it.start <= s.nowMin && s.nowMin < it.start + it.dur;
            boolean late = s.nowMin >= it.start + it.dur;
            String status;
            int color;
            if (active) { status = "進行中・あと" + WidgetData.duration(it.start + it.dur - s.nowMin); color = WidgetData.TEAL; }
            else if (late) { status = "時間を過ぎています"; color = WidgetData.LATE; }
            else { status = "あと" + WidgetData.duration(it.start - s.nowMin) + "で開始"; color = WidgetData.DIM; }
            v.setTextViewText(R.id.w_status, status);
            v.setTextColor(R.id.w_status, color);
            v.setInt(R.id.w_avatar_bg, "setColorFilter", it.color);
            v.setTextViewText(R.id.w_avatar, it.initial);
            v.setTextColor(R.id.w_avatar, WidgetData.inkOn(it.color));
            v.setTextViewText(R.id.w_title, it.title);
            v.setTextViewText(R.id.w_time, WidgetData.time(it.start) + "–" + WidgetData.time(Math.min(it.start + it.dur, 24 * 60))
                + (it.review ? "・復習" : ""));
        }
        v.setOnClickPendingIntent(R.id.w_root, openApp(context));
        return v;
    }
}
