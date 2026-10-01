package com.studysync.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * Home screen widget showing today's task summary. Data is written by
 * {@link WidgetBridgePlugin} from the web app whenever the task list changes;
 * this provider just reads that cache and paints the RemoteViews.
 */
public class TaskWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "studysync_widget";
    public static final String KEY_TOTAL = "today_total";
    public static final String KEY_DONE = "today_done";
    public static final String KEY_NEXT_TITLE = "next_title";
    public static final String KEY_NEXT_META = "next_meta";
    public static final String KEY_UPDATED_LABEL = "updated_label";

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new android.content.ComponentName(context, TaskWidgetProvider.class));
        if (ids.length > 0) {
            new TaskWidgetProvider().onUpdate(context, manager, ids);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int total = prefs.getInt(KEY_TOTAL, 0);
        int done = prefs.getInt(KEY_DONE, 0);
        String nextTitle = prefs.getString(KEY_NEXT_TITLE, "");
        String nextMeta = prefs.getString(KEY_NEXT_META, "");
        String updatedLabel = prefs.getString(KEY_UPDATED_LABEL, "");

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_task);

            views.setTextViewText(R.id.widget_count, done + " / " + total);
            views.setTextViewText(R.id.widget_label, "今日のタスク");

            if (nextTitle != null && !nextTitle.isEmpty()) {
                views.setTextViewText(R.id.widget_next_title, nextTitle);
                views.setTextViewText(R.id.widget_next_meta, nextMeta);
                views.setViewVisibility(R.id.widget_next_title, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_next_meta, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_empty, android.view.View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_next_title, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_next_meta, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_empty, android.view.View.VISIBLE);
                views.setTextViewText(R.id.widget_empty, total == 0 ? "タスクはありません" : "今日のタスクは完了です");
            }
            views.setTextViewText(R.id.widget_updated, updatedLabel);

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
