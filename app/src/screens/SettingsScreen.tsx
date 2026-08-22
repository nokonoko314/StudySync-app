import { useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';
import { DEFAULT_SUBJECT_COLORS } from '../state/types';
import { BottomSheet, ActionSheet, AppAlert, useToast } from '../components/Overlay';
import {
  BellIcon, ImageIcon, LinkIcon, MoonIcon, PaletteIcon, TargetIcon, ClockIcon,
  MessageIcon, HistoryIcon, UploadIcon,
} from '../components/Icons';
import { ReviewIntervalEditor } from '../components/ReviewIntervalEditor';
import { ColorPickerField } from '../components/ColorPickerField';
import type { TimerStyle, Subject, GroupProject, Task, StudySession } from '../state/types';
import { CHANGELOG, APP_VERSION } from '../lib/changelog';

const TIMER_STYLE_LABELS: Record<TimerStyle, string> = { ring: 'リング', digital: 'デジタル', minimal: 'ミニマル' };
const DUE_REMINDER_OPTIONS = [0, 1, 3, 6, 12, 24, 48];
const FEEDBACK_ENDPOINT = 'https://formspree.io/f/mzepwvkg';

interface ImportBundle {
  subjects?: Subject[];
  projects?: GroupProject[];
  tasks?: Task[];
  sessions?: StudySession[];
}

export function SettingsScreen() {
  const { data, updateSettings, resetAll, importBundle } = useAppState();
  const { user: authUser, loading: authLoading, signIn: authSignIn, signOut: authSignOut } = useAuth();
  const { showToast } = useToast();
  const [accentOpen, setAccentOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [wallpaperColorOpen, setWallpaperColorOpen] = useState(false);
  const [wallpaperColor, setWallpaperColor] = useState(data.settings.wallpaper.color);
  const [resetOpen, setResetOpen] = useState(false);
  const [intervalsOpen, setIntervalsOpen] = useState(false);
  const [timerStyleOpen, setTimerStyleOpen] = useState(false);
  const [dueTimeOpen, setDueTimeOpen] = useState(false);
  const [dueReminderOpen, setDueReminderOpen] = useState(false);
  const [dailyReminderOpen, setDailyReminderOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [goalHours, setGoalHours] = useState(Math.floor(data.settings.weeklyGoalMinutes / 60));
  const [goalMinutes, setGoalMinutes] = useState(data.settings.weeklyGoalMinutes % 60);
  const [defaultDueTime, setDefaultDueTime] = useState(data.settings.defaultDueTime);
  const [dailyReminderTime, setDailyReminderTime] = useState(data.settings.dailyReminderTime);
  const importInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = 1080;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      updateSettings({ wallpaper: { mode: 'photo', color: data.settings.wallpaper.color, photoDataUrl: dataUrl } });
      URL.revokeObjectURL(objectUrl);
      showToast('壁紙を写真に設定しました');
    };
    img.src = objectUrl;
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = JSON.parse(String(reader.result)) as ImportBundle;
        const counts = [
          bundle.subjects?.length ? `教科${bundle.subjects.length}件` : null,
          bundle.projects?.length ? `プロジェクト${bundle.projects.length}件` : null,
          bundle.tasks?.length ? `タスク${bundle.tasks.length}件` : null,
          bundle.sessions?.length ? `学習記録${bundle.sessions.length}件` : null,
        ].filter(Boolean).join('・');
        importBundle(bundle);
        showToast(counts ? `${counts}を読み込みました` : 'データを読み込みました');
      } catch {
        showToast('ファイルを読み込めませんでした。正しいバックアップファイルか確認してください');
      }
    };
    reader.readAsText(file);
  };

  const isDark = data.settings.themeMode === 'dark'
    || (data.settings.themeMode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  return (
    <div className="content">
      <div className="scroll" style={{ paddingBottom: 120 }}>
        <div className="settings-hero">
          <p className="settings-title">設定</p>
          <p className="settings-sub">表示・連携・通知をカスタマイズ</p>
        </div>

        <p className="section-label">外観</p>
        <div className="group">
          <button className="row" onClick={() => setAccentOpen(true)}>
            <div className="row-icon" style={{ background: data.settings.accentColor }}><PaletteIcon /></div>
            <span className="row-label">テーマカラー</span>
            <span className="dot" style={{ width: 18, height: 18, borderRadius: '50%', background: data.settings.accentColor }} />
            <div className="chevron" />
          </button>
          <button className="row" onClick={() => updateSettings({ themeMode: isDark ? 'light' : 'dark' })}>
            <div className="row-icon" style={{ background: 'var(--ink)' }}><MoonIcon /></div>
            <span className="row-label">ダークモード</span>
            <div className={`switch${isDark ? ' on' : ''}`} />
          </button>
          <button className="row" onClick={() => setWallpaperOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--gold)' }}><ImageIcon /></div>
            <span className="row-label">壁紙</span>
            <span className="row-value">
              {data.settings.wallpaper.mode === 'default' ? 'クリーム(既定)' : data.settings.wallpaper.mode === 'color' ? 'カラー' : '写真'}
            </span>
            <div className="chevron" />
          </button>
        </div>

        <p className="section-label">学習</p>
        <div className="group">
          <button className="row" onClick={() => setGoalOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--sage)' }}><TargetIcon /></div>
            <span className="row-label">週間目標</span>
            <span className="row-value">{(data.settings.weeklyGoalMinutes / 60).toFixed(data.settings.weeklyGoalMinutes % 60 === 0 ? 0 : 1)}時間</span>
            <div className="chevron" />
          </button>
          <button className="row" onClick={() => { setDefaultDueTime(data.settings.defaultDueTime); setDueTimeOpen(true); }}>
            <div className="row-icon" style={{ background: 'var(--sage)' }}><ClockIcon color="#fff" /></div>
            <span className="row-label">既定の期限時刻</span>
            <span className="row-value">{data.settings.defaultDueTime}</span>
            <div className="chevron" />
          </button>
          <button
            className="row"
            onClick={() => updateSettings({ defaultReviewEnabled: !data.settings.defaultReviewEnabled })}
          >
            <div className="row-icon" style={{ background: 'var(--indigo)' }}><ClockIcon color="#fff" /></div>
            <span className="row-label">既定で自動復習を追加</span>
            <div className={`switch${data.settings.defaultReviewEnabled ? ' on' : ''}`} />
          </button>
          <button className="row" onClick={() => setIntervalsOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--indigo)' }}><ClockIcon color="#fff" /></div>
            <span className="row-label">復習間隔(既定)</span>
            <span className="row-value">{data.settings.reviewIntervalsDays.join(', ')}日</span>
            <div className="chevron" />
          </button>
          <button className="row" onClick={() => setTimerStyleOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--gold)' }}><ClockIcon color="#fff" /></div>
            <span className="row-label">タイマーのスタイル</span>
            <span className="row-value">{TIMER_STYLE_LABELS[data.settings.timerStyle]}</span>
            <div className="chevron" />
          </button>
        </div>

        <p className="section-label">通知</p>
        <div className="group">
          <button className="row" onClick={() => updateSettings({ notificationsEnabled: !data.settings.notificationsEnabled })}>
            <div className="row-icon" style={{ background: 'var(--coral)' }}><BellIcon /></div>
            <span className="row-label">通知を有効にする</span>
            <div className={`switch${data.settings.notificationsEnabled ? ' on' : ''}`} />
          </button>
          {data.settings.notificationsEnabled && (
            <>
              <button className="row" onClick={() => setDueReminderOpen(true)}>
                <div className="row-icon" style={{ background: 'var(--coral)' }}><ClockIcon color="#fff" /></div>
                <span className="row-label">期限のリマインダー</span>
                <span className="row-value">
                  {data.settings.dueReminderHours === 0 ? '期限の時刻' : `${data.settings.dueReminderHours}時間前`}
                </span>
                <div className="chevron" />
              </button>
              <button
                className="row"
                onClick={() => updateSettings({ dailyReminderEnabled: !data.settings.dailyReminderEnabled })}
              >
                <div className="row-icon" style={{ background: 'var(--coral)' }}><BellIcon /></div>
                <span className="row-label">毎日のリマインダー</span>
                <div className={`switch${data.settings.dailyReminderEnabled ? ' on' : ''}`} />
              </button>
              {data.settings.dailyReminderEnabled && (
                <button
                  className="row"
                  onClick={() => { setDailyReminderTime(data.settings.dailyReminderTime); setDailyReminderOpen(true); }}
                >
                  <div className="row-icon" style={{ background: 'var(--coral)' }}><ClockIcon color="#fff" /></div>
                  <span className="row-label">リマインダー時刻</span>
                  <span className="row-value">{data.settings.dailyReminderTime}</span>
                  <div className="chevron" />
                </button>
              )}
            </>
          )}
        </div>

        <p className="section-label">連携</p>
        <div className="group">
          <button
            className="row"
            disabled={authLoading}
            onClick={async () => {
              if (authUser) {
                setUnlinkConfirmOpen(true);
                return;
              }
              try {
                await authSignIn();
                showToast('Googleアカウントと連携しました');
              } catch {
                showToast('Google連携に失敗しました。設定が完了していない可能性があります');
              }
            }}
          >
            <div className="row-icon" style={{ background: 'var(--coral)' }}><LinkIcon /></div>
            <span className="row-label">Googleアカウント連携</span>
            <span className="row-value">
              {authLoading ? '確認中…' : authUser ? (authUser.email ?? '連携済み') : '未連携'}
            </span>
            <div className="chevron" />
          </button>
          {authUser && (
            <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 12px 0', lineHeight: 1.7 }}>
              連携中は学習データが自動的にこのアカウントに保存され、他の端末でログインすると自動で復元されます。
            </p>
          )}
        </div>

        <p className="section-label">データ</p>
        <div className="group">
          <button className="row" onClick={() => importInputRef.current?.click()}>
            <div className="row-icon" style={{ background: 'var(--indigo)' }}><UploadIcon /></div>
            <span className="row-label">バックアップをインポート</span>
            <div className="chevron" />
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button className="row danger-row" onClick={() => setResetOpen(true)}>
            <span className="row-label">すべてのデータをリセット</span>
          </button>
        </div>

        <p className="section-label">サポート</p>
        <div className="group">
          <button className="row" onClick={() => setFeedbackOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--sage)' }}><MessageIcon /></div>
            <span className="row-label">ご要望・お問い合わせ</span>
            <div className="chevron" />
          </button>
          <button className="row" onClick={() => setChangelogOpen(true)}>
            <div className="row-icon" style={{ background: 'var(--gold)' }}><HistoryIcon /></div>
            <span className="row-label">変更履歴</span>
            <div className="chevron" />
          </button>
        </div>

        <p className="section-label">アプリ情報</p>
        <div className="group">
          <div className="row">
            <span className="row-label" style={{ fontWeight: 500 }}>バージョン</span>
            <span className="row-value">{APP_VERSION}</span>
          </div>
        </div>
      </div>

      <BottomSheet
        open={accentOpen}
        onClose={() => setAccentOpen(false)}
        title="テーマカラー"
        confirmLabel="完了"
        onConfirm={() => { setAccentOpen(false); showToast('テーマカラーを変更しました'); }}
      >
        <div className="field-label">プリセット・カスタムカラー</div>
        <ColorPickerField
          value={data.settings.accentColor}
          onChange={(c) => updateSettings({ accentColor: c })}
          presets={DEFAULT_SUBJECT_COLORS}
          ariaLabelPrefix="テーマカラーを"
        />
      </BottomSheet>

      <BottomSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="週間目標"
        confirmLabel="完了"
        onConfirm={() => {
          updateSettings({ weeklyGoalMinutes: goalHours * 60 + goalMinutes });
          setGoalOpen(false);
          showToast(`週間目標を${goalHours}時間${goalMinutes ? goalMinutes + '分' : ''}に設定しました`);
        }}
      >
        <div className="field-label">1週間の学習目標時間</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="number" className="field" min={0} max={80} value={goalHours}
            onChange={(e) => setGoalHours(Number(e.target.value))}
          />
          <input
            type="number" className="field" min={0} max={59} step={15} value={goalMinutes}
            onChange={(e) => setGoalMinutes(Number(e.target.value))}
          />
        </div>
      </BottomSheet>

      <BottomSheet
        open={dueTimeOpen}
        onClose={() => setDueTimeOpen(false)}
        title="既定の期限時刻"
        confirmLabel="完了"
        onConfirm={() => {
          updateSettings({ defaultDueTime: defaultDueTime });
          setDueTimeOpen(false);
          showToast(`既定の期限時刻を${defaultDueTime}に設定しました`);
        }}
      >
        <div className="field-label">期限に日付だけ指定したときの時刻</div>
        <input type="time" className="field" value={defaultDueTime} onChange={(e) => setDefaultDueTime(e.target.value)} />
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 2px 0', lineHeight: 1.7 }}>
          タスク作成・編集で期限の日付だけを選ぶと、この時刻が自動的に使われます。
        </p>
      </BottomSheet>

      <ActionSheet
        open={dueReminderOpen}
        onClose={() => setDueReminderOpen(false)}
        title="期限のリマインダー"
        subtitle="期限のあるタスクを、期限の何時間前に知らせるか"
        options={DUE_REMINDER_OPTIONS.map((hours) => ({
          label: hours === 0 ? '期限の時刻' : `${hours}時間前`,
          onSelect: () => {
            updateSettings({ dueReminderHours: hours });
            showToast(hours === 0 ? '期限の時刻に通知するように設定しました' : `期限の${hours}時間前に通知するように設定しました`);
          },
        }))}
      />

      <BottomSheet
        open={dailyReminderOpen}
        onClose={() => setDailyReminderOpen(false)}
        title="毎日のリマインダー時刻"
        confirmLabel="完了"
        onConfirm={() => {
          updateSettings({ dailyReminderTime });
          setDailyReminderOpen(false);
          showToast(`毎日${dailyReminderTime}に通知するように設定しました`);
        }}
      >
        <div className="field-label">毎日この時刻に学習リマインダーを通知します</div>
        <input type="time" className="field" value={dailyReminderTime} onChange={(e) => setDailyReminderTime(e.target.value)} />
      </BottomSheet>

      <BottomSheet
        open={feedbackOpen}
        onClose={() => { if (!feedbackSending) setFeedbackOpen(false); }}
        title="ご要望・お問い合わせ"
        confirmLabel={feedbackSending ? '送信中…' : '送信'}
        confirmDisabled={feedbackText.trim().length === 0 || feedbackSending}
        onConfirm={async () => {
          if (feedbackSending) return;
          setFeedbackSending(true);
          try {
            const res = await fetch(FEEDBACK_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                message: feedbackText,
                appVersion: APP_VERSION,
                sentAt: new Date().toISOString(),
              }),
            });
            if (res.ok) {
              setFeedbackOpen(false);
              setFeedbackText('');
              showToast('ご要望を送信しました。ありがとうございます');
            } else {
              showToast('送信に失敗しました。時間をおいて再度お試しください');
            }
          } catch {
            showToast('送信に失敗しました。通信環境をご確認ください');
          } finally {
            setFeedbackSending(false);
          }
        }}
      >
        <div className="field-label">アプリへのご要望・不具合報告など</div>
        <textarea
          className="field"
          style={{ minHeight: 140, resize: 'vertical', lineHeight: 1.6 }}
          placeholder="例：〇〇の画面で△△できるようにしてほしい"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 2px 0', lineHeight: 1.7 }}>
          「送信」を押すと、この内容が開発者に直接届きます。
        </p>
      </BottomSheet>

      <BottomSheet
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        title="変更履歴"
      >
        {CHANGELOG.map((entry) => (
          <div key={entry.version} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>v{entry.version}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{entry.date}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
              {entry.changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        ))}
      </BottomSheet>

      <BottomSheet
        open={intervalsOpen}
        onClose={() => setIntervalsOpen(false)}
        title="復習間隔(既定)"
        confirmLabel="完了"
        onConfirm={() => { setIntervalsOpen(false); showToast('復習間隔を更新しました'); }}
      >
        <div className="field-label">タスクの復習間隔を編集</div>
        <ReviewIntervalEditor
          days={data.settings.reviewIntervalsDays}
          onChange={(days) => updateSettings({ reviewIntervalsDays: days })}
        />
      </BottomSheet>

      <ActionSheet
        open={timerStyleOpen}
        onClose={() => setTimerStyleOpen(false)}
        title="タイマーのスタイル"
        options={(['ring', 'digital', 'minimal'] as TimerStyle[]).map((style) => ({
          label: TIMER_STYLE_LABELS[style],
          onSelect: () => { updateSettings({ timerStyle: style }); showToast(`タイマーを${TIMER_STYLE_LABELS[style]}に変更しました`); },
        }))}
      />

      <ActionSheet
        open={wallpaperOpen}
        onClose={() => setWallpaperOpen(false)}
        title="壁紙を設定"
        options={[
          { label: 'カラーから選ぶ', onSelect: () => { setWallpaperColor(data.settings.wallpaper.color); setWallpaperColorOpen(true); } },
          { label: '写真を選ぶ', onSelect: () => photoInputRef.current?.click() },
          {
            label: '既定に戻す',
            destructive: true,
            onSelect: () => {
              updateSettings({ wallpaper: { mode: 'default', color: '#FBF6EF', photoDataUrl: null } });
              showToast('壁紙を既定に戻しました');
            },
          },
        ]}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoFile}
      />

      <BottomSheet
        open={wallpaperColorOpen}
        onClose={() => setWallpaperColorOpen(false)}
        title="壁紙のカラー"
        confirmLabel="完了"
        onConfirm={() => {
          updateSettings({ wallpaper: { mode: 'color', color: wallpaperColor, photoDataUrl: data.settings.wallpaper.photoDataUrl } });
          setWallpaperColorOpen(false);
          showToast('壁紙のカラーを変更しました');
        }}
      >
        <div className="field-label">背景カラー</div>
        <ColorPickerField
          value={wallpaperColor}
          onChange={setWallpaperColor}
          presets={['#FBF6EF', '#EAF3EC', '#EAF0FB', '#FBEAEA', '#F6EFE0', '#111318']}
          ariaLabelPrefix="壁紙のカラーを"
        />
      </BottomSheet>

      <AppAlert
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="すべてのデータを削除しますか？"
        message="タスク・統計・設定がすべて削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={() => { resetAll(); showToast('データを削除しました'); }}
      />

      <AppAlert
        open={unlinkConfirmOpen}
        onClose={() => setUnlinkConfirmOpen(false)}
        title="Google連携を解除しますか？"
        message={
          (authUser?.email ? `${authUser.email} との連携を解除します。` : '') +
          'クラウド上のデータは残りますが、この端末のデータは初期状態に戻ります。同じアカウントで再度連携すると、クラウドのデータが自動的に復元されます。'
        }
        confirmLabel="解除する"
        onConfirm={async () => {
          try {
            await authSignOut();
          } catch {
            showToast('連携解除に失敗しました');
          }
        }}
      />
    </div>
  );
}
