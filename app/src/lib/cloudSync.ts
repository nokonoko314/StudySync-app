import { Capacitor } from '@capacitor/core';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import type { AppData } from '../state/types';

function docRef(uid: string): string {
  return `backups/${uid}`;
}

export async function pushCloudBackup(uid: string, data: AppData): Promise<number> {
  if (!Capacitor.isNativePlatform()) return Date.now();
  const updatedAt = Date.now();
  await FirebaseFirestore.setDocument({
    reference: docRef(uid),
    data: { ...data, updatedAt },
  });
  return updatedAt;
}

export async function fetchCloudBackup(uid: string): Promise<{ data: AppData; updatedAt: number } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const res = await FirebaseFirestore.getDocument({ reference: docRef(uid) });
  const snap = res.snapshot.data as (AppData & { updatedAt?: number }) | undefined;
  if (!snap) return null;
  const { updatedAt, ...data } = snap;
  return { data: data as AppData, updatedAt: updatedAt ?? Date.now() };
}
