package com.studysync.preview;

import android.accounts.Account;
import android.app.Activity;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import java.util.ArrayList;
import java.util.List;

/**
 * Googleカレンダーを使うための許可(アクセストークン)を取る。
 * 一度許可すれば、以降は画面を出さずに新しいトークンを受け取れる(トークンは約1時間で切れるので同期のたびに取り直す)。
 */
@CapacitorPlugin(name = "GoogleCalendarAuth")
public class GoogleCalendarAuthPlugin extends Plugin {

    private ActivityResultLauncher<IntentSenderRequest> consentLauncher;
    private PluginCall pendingCall;

    @Override
    public void load() {
        consentLauncher = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(), this::onConsentResult);
    }

    /**
     * scopes: 必要な権限。interactive: まだ許可がないとき、許可の画面を出すか(false なら NEEDS_CONSENT で失敗する)。
     * email: ログイン中のGoogleアカウント(複数アカウントのときに選ぶ画面を出さないため)
     */
    @PluginMethod
    public void authorize(PluginCall call) {
        List<Scope> scopes = new ArrayList<>();
        try {
            JSArray arr = call.getArray("scopes");
            if (arr != null) for (Object s : arr.toList()) scopes.add(new Scope(String.valueOf(s)));
        } catch (Exception e) {
            call.reject("権限の指定が正しくありません", "BAD_SCOPES");
            return;
        }
        if (scopes.isEmpty()) { call.reject("権限の指定がありません", "BAD_SCOPES"); return; }
        boolean interactive = Boolean.TRUE.equals(call.getBoolean("interactive", false));
        // Googleログイン(@capacitor-firebase/authentication)で動いている形にそろえる:
        // サーバー用のクライアントID(Web)を添え、アカウントはGoogleに選ばせる(指定すると 400 になる端末がある)
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder()
            .setRequestedScopes(scopes)
            .requestOfflineAccess(getContext().getString(R.string.default_web_client_id));
        String email = call.getString("email");
        if (Boolean.TRUE.equals(call.getBoolean("useAccount", false)) && email != null && !email.isEmpty()) {
            builder.setAccount(new Account(email, "com.google"));
        }

        Identity.getAuthorizationClient(getActivity()).authorize(builder.build())
            .addOnSuccessListener(result -> {
                if (!result.hasResolution()) { resolve(call, result); return; }
                if (!interactive || result.getPendingIntent() == null) { call.reject("Googleカレンダーの許可が必要です", "NEEDS_CONSENT"); return; }
                if (pendingCall != null) pendingCall.reject("別の許可の画面が開いています", "BUSY");
                pendingCall = call;
                consentLauncher.launch(new IntentSenderRequest.Builder(result.getPendingIntent().getIntentSender()).build());
            })
            .addOnFailureListener(e -> call.reject(e.getMessage() != null ? e.getMessage() : "許可を確認できませんでした", "AUTH_FAILED"));
    }

    private void onConsentResult(ActivityResult res) {
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call == null) return;
        if (res.getResultCode() != Activity.RESULT_OK || res.getData() == null) { call.reject("許可がキャンセルされました", "CANCELED"); return; }
        try {
            resolve(call, Identity.getAuthorizationClient(getActivity()).getAuthorizationResultFromIntent(res.getData()));
        } catch (ApiException e) {
            call.reject("許可を確認できませんでした(" + e.getStatusCode() + ")", "AUTH_FAILED");
        }
    }

    private void resolve(PluginCall call, AuthorizationResult result) {
        if (result.getAccessToken() == null) { call.reject("アクセストークンを受け取れませんでした", "NO_TOKEN"); return; }
        JSObject out = new JSObject();
        out.put("accessToken", result.getAccessToken());
        out.put("scopes", new JSArray(result.getGrantedScopes()));
        call.resolve(out);
    }
}
