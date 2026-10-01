package com.studysync.preview;

import android.os.Bundle;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        // 起動画面から画面が切り替わるときに、別の色が一瞬見えないよう背景色をそろえる(端末のライト/ダークに合わせる)
        int background = ContextCompat.getColor(this, R.color.splash_background);
        getWindow().getDecorView().setBackgroundColor(background);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(background);
        }
    }
}
