package com.studysync.preview;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/** ウィジェット「今週の勉強時間」(横長)。6日前〜今日の勉強時間の棒グラフ */
public class WeekWidgetProvider extends BaseWidgetProvider {

    @Override
    RemoteViews build(Context context, AppWidgetManager manager, int id, WidgetData.Snapshot s) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_week);
        int sum = 0;
        for (int m : s.week) sum += m;
        v.setTextViewText(R.id.w_total, sum == 0 ? "" : "合計 " + WidgetData.duration(sum));
        // グラフはウィジェットの大きさに合わせて描く(左右の余白 16dp×2、見出しと上下の余白で約 62dp)
        int[] size = WidgetData.sizeDp(manager, id, 250, 110);
        int w = Math.max(120, size[0] - 32), h = Math.max(48, size[1] - 62);
        v.setImageViewBitmap(R.id.w_chart, WidgetData.weekChart(context, w, h, s.week, s.now));
        v.setOnClickPendingIntent(R.id.w_root, openApp(context));
        return v;
    }
}
