package com.studysync.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lets the web app push today's task summary into SharedPreferences so the
 * home screen widget (TaskWidgetProvider) can display it without needing to
 * boot the WebView. Call from JS via the "WidgetBridge" plugin.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context context = getContext();
        SharedPreferences.Editor editor = context
            .getSharedPreferences(TaskWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            .edit();

        editor.putInt(TaskWidgetProvider.KEY_TOTAL, call.getInt("total", 0));
        editor.putInt(TaskWidgetProvider.KEY_DONE, call.getInt("done", 0));
        editor.putString(TaskWidgetProvider.KEY_NEXT_TITLE, call.getString("nextTitle", ""));
        editor.putString(TaskWidgetProvider.KEY_NEXT_META, call.getString("nextMeta", ""));
        editor.putString(TaskWidgetProvider.KEY_UPDATED_LABEL, call.getString("updatedLabel", ""));
        editor.apply();

        TaskWidgetProvider.updateAll(context);

        call.resolve(new JSObject());
    }
}
