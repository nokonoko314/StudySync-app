package com.studysync.preview;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.RemoteViews;

/** ウィジェット共通の土台。各ウィジェットは build() で見た目を作るだけ */
public abstract class BaseWidgetProvider extends AppWidgetProvider {

    abstract RemoteViews build(Context context, AppWidgetManager manager, int id, WidgetData.Snapshot s);

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        WidgetData.Snapshot s = WidgetData.load(context);
        for (int id : ids) manager.updateAppWidget(id, build(context, manager, id, s));
        WidgetData.scheduleTick(context, s);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        onUpdate(context, manager, new int[] { id });
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (WidgetData.ACTION_TICK.equals(intent.getAction())) { WidgetData.updateAll(context); return; }
        super.onReceive(context, intent);
    }

    /** タップでアプリを開く */
    static PendingIntent openApp(Context context) {
        Intent launch = new Intent(context, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
