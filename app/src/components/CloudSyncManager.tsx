import { useEffect, useRef } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';
import { useToast } from './Overlay';
import { fetchCloudBackup, pushCloudBackup } from '../lib/cloudSync';

const SAVE_DEBOUNCE_MS = 4000;

/**
 * Invisible: keeps a signed-in user's data mirrored to Firestore with no manual steps.
 * On sign-in it checks for an existing cloud backup once — restoring it immediately if found,
 * or seeding the cloud with the current local data if not — then quietly re-saves to the cloud
 * a few seconds after any local change. On sign-out it clears local data back to the fresh
 * default state, so a different account (or the same one signing back in) never inherits
 * whatever was left over from the previous session.
 */
export function CloudSyncManager() {
  const { data, replaceAll, resetAll } = useAppState();
  const { user } = useAuth();
  const { showToast } = useToast();
  const prevUid = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const syncReady = useRef(false);

  useEffect(() => {
    const uid = user?.uid ?? null;
    const previous = prevUid.current;
    if (uid === previous) return;
    prevUid.current = uid;
    syncReady.current = false;

    if (!uid) {
      if (previous) {
        resetAll();
        showToast('連携を解除し、データを初期状態に戻しました');
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const cloud = await fetchCloudBackup(uid);
        if (cancelled) return;
        if (cloud) {
          replaceAll(cloud.data);
          showToast('クラウドの学習データを復元しました');
        } else {
          await pushCloudBackup(uid, data);
          if (!cancelled) showToast('学習データをクラウドに保存しました');
        }
      } catch {
        if (!cancelled) showToast('クラウドとの通信に失敗しました。通信環境をご確認ください');
      } finally {
        if (!cancelled) syncReady.current = true;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid || !syncReady.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      pushCloudBackup(uid, data).catch(() => showToast('クラウドへのバックアップに失敗しました'));
    }, SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user?.uid]);

  return null;
}
