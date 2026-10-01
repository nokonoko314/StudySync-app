package com.studysync.preview;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** アプリから予定・未設定のタスク・勉強時間を受け取り、ホーム画面ウィジェットをすべて更新する */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        context.getSharedPreferences(WidgetData.PREFS, Context.MODE_PRIVATE)
            .edit().putString(WidgetData.KEY_DAYS, call.getString("data", "{}")).apply();
        WidgetData.updateAll(context);
        call.resolve();
    }
}
