package com.studysync.preview;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** アプリから今日と明日の予定を受け取り、ホーム画面ウィジェットに反映する */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        context.getSharedPreferences(TaskWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit().putString(TaskWidgetProvider.KEY_DAYS, call.getString("data", "{}")).apply();
        TaskWidgetProvider.updateAll(context);
        call.resolve();
    }
}
