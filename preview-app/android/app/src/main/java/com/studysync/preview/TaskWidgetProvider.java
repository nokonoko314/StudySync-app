package com.studysync.preview;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

/**
 * ウィジェット「今日の予定」。今日の予定と未設定のタスクをスクロールできる一覧で表示する
 * (一覧の各行は TaskWidgetService が作る)。
 */
public class TaskWidgetProvider extends BaseWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        super.onUpdate(context, manager, ids);
        manager.notifyAppWidgetViewDataChanged(ids, R.id.w_list);
    }

    @Override
    RemoteViews build(Context context, AppWidgetManager manager, int id, WidgetData.Snapshot s) {
        int total = s.total(), done = s.done();
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_task);
        v.setTextViewText(R.id.w_date, "今日 " + WidgetData.dateLabel(s.now));
        v.setTextViewText(R.id.w_count, total == 0 ? "" : done + " / " + total + " 完了");
        v.setProgressBar(R.id.w_progress, Math.max(total, 1), done, false);
        v.setViewVisibility(R.id.w_progress, total == 0 ? View.GONE : View.VISIBLE);

        Intent svc = new Intent(context, TaskWidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(R.id.w_list, svc);
        v.setEmptyView(R.id.w_list, R.id.w_empty);
        v.setTextViewText(R.id.w_empty, s.today == null ? "アプリを開くと今日の予定が表示されます" : "今日の予定はありません");
        // 一覧の行のタップは MUTABLE でないと fill-in が効かない(行ごとの中身は同じなので実害はない)
        Intent launch = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        v.setPendingIntentTemplate(R.id.w_list, PendingIntent.getActivity(context, 1, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));
        v.setOnClickPendingIntent(R.id.w_root, openApp(context));
        return v;
    }
}
