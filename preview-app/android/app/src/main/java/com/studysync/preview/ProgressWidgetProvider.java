package com.studysync.preview;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/** ウィジェット「今日の進み具合」(小)。完了数のリングと、今日の勉強時間・残りの復習 */
public class ProgressWidgetProvider extends BaseWidgetProvider {

    @Override
    RemoteViews build(Context context, AppWidgetManager manager, int id, WidgetData.Snapshot s) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_ring);
        int total = s.total(), done = s.done();
        v.setTextViewText(R.id.w_date, "今日 " + WidgetData.dateLabel(s.now));
        v.setImageViewBitmap(R.id.w_ring, WidgetData.ring(context, 96, total == 0 ? 0 : (float) done / total));
        v.setTextViewText(R.id.w_ring_value, total == 0 ? "—" : done + "/" + total);
        v.setTextViewText(R.id.w_ring_label, total > 0 && done == total ? "すべて完了" : "完了");
        v.setTextViewText(R.id.w_studied, "勉強 " + WidgetData.duration(s.week[6]));
        int reviews = s.reviewsLeft();
        v.setTextViewText(R.id.w_reviews, reviews > 0 ? "復習 残り" + reviews : "復習 なし");
        v.setTextColor(R.id.w_reviews, reviews > 0 ? WidgetData.TEAL : WidgetData.DIM);
        v.setOnClickPendingIntent(R.id.w_root, openApp(context));
        return v;
    }
}
