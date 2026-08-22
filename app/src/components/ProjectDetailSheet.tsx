import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, AppAlert, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import type { GroupProject } from '../state/types';
import { DEFAULT_SUBJECT_COLORS } from '../state/types';
import { subjectBreakdown, sessionDurationMs } from '../lib/stats';
import { startOfDay } from '../lib/format';
import { ColorPickerField } from './ColorPickerField';
import { ProjectCalendarSheet } from './ProjectCalendarSheet';

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ProjectDetailSheet({ project, onClose }: { project: GroupProject | null; onClose: () => void }) {
  const { data, updateProject, archiveProject, unarchiveProject, deleteProject, restoreProject } = useAppState();
  const { showToast } = useToast();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#2E7D9A');
  const [hasPeriod, setHasPeriod] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
      setHasPeriod(!!(project.startDate && project.endDate));
      setStartDate(project.startDate ?? todayInput());
      setEndDate(project.endDate ?? todayInput());
    }
  }, [project]);

  const stats = useMemo(() => {
    if (!project) return null;
    const projectTasks = data.tasks.filter((t) => t.projectId === project.id);
    const doneCount = projectTasks.filter((t) => t.completed).length;
    const taskIds = new Set(projectTasks.map((t) => t.id));
    const projectSessions = data.sessions.filter((s) => s.taskId && taskIds.has(s.taskId));
    const totalMs = projectSessions.reduce((sum, s) => sum + sessionDurationMs(s), 0);
    const breakdown = subjectBreakdown(projectSessions, data.subjects.filter((s) => !s.archived));
    const msByDay = new Map<string, number>();
    for (const s of projectSessions) {
      const key = startOfDay(new Date(s.startedAt)).toDateString();
      msByDay.set(key, (msByDay.get(key) ?? 0) + sessionDurationMs(s));
    }
    return { projectTasks, doneCount, totalMs, breakdown, msByDay };
  }, [project, data.tasks, data.sessions, data.subjects]);

  if (!project || !stats) return null;

  const today = startOfDay(new Date());
  const isEnded = project.endDate ? new Date(project.endDate) < today : false;
  const maxBreakdown = Math.max(1, ...stats.breakdown.map((b) => b.ms));
  const canSave = name.trim().length > 0 && (!hasPeriod || (startDate && endDate && startDate <= endDate));

  const save = () => {
    if (!canSave) return;
    updateProject(project.id, {
      name: name.trim(),
      color,
      startDate: hasPeriod ? startDate : null,
      endDate: hasPeriod ? endDate : null,
    });
    showToast('プロジェクトを更新しました');
    onClose();
  };

  return (
    <>
      <BottomSheet open={!!project} onClose={onClose} title="プロジェクトを編集" confirmLabel="保存" onConfirm={save} confirmDisabled={!canSave}>
        <div className="field-label">プロジェクト名</div>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="field-label">カラー</div>
        <ColorPickerField value={color} onChange={setColor} presets={DEFAULT_SUBJECT_COLORS} />

        <div className="field-label">期間</div>
        <button className="row" style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none' }} onClick={() => setHasPeriod((v) => !v)}>
          <span className="row-label">開始日・終了日を設定する</span>
          <div className={`switch${hasPeriod ? ' on' : ''}`} />
        </button>
        {hasPeriod && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
        {isEnded && (
          <p style={{ fontSize: 11.5, color: 'var(--coral)', fontWeight: 700, margin: '8px 2px 0' }}>この期間は終了しています</p>
        )}

        <div className="stat-row" style={{ padding: 0, marginTop: 18 }}>
          <div className="stat-tile">
            <span className="s-val">{stats.doneCount}/{stats.projectTasks.length}</span>
            <span className="s-label">タスク完了</span>
          </div>
          <div className="stat-tile">
            <span className="s-val">{(stats.totalMs / 3600000).toFixed(1)}h</span>
            <span className="s-label">合計学習時間</span>
          </div>
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>教科別の内訳</div>
        <div className="subject-bars">
          {stats.breakdown.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>このプロジェクトに紐づく学習記録はまだありません</p>
          )}
          {stats.breakdown.map((b) => (
            <div className="subject-bar-row" key={b.id}>
              <span className="dot" style={{ background: b.color }} />
              <span className="name">{b.name}</span>
              <span className="track"><i style={{ width: `${(b.ms / maxBreakdown) * 100}%`, background: b.color }} /></span>
              <span className="val">{(b.ms / 3600000).toFixed(1)}h</span>
            </div>
          ))}
        </div>

        <div className="field-label" style={{ marginTop: 18 }}>日別の学習時間</div>
        <button
          className="row"
          style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none' }}
          onClick={() => setCalendarOpen(true)}
        >
          <span className="row-label">カレンダーを見る</span>
          {stats.totalMs === 0 && <span className="row-value">記録なし</span>}
          <div className="chevron" />
        </button>

        {project.archived ? (
          <button
            className="pillbtn"
            style={{ background: 'var(--surface2)', color: 'var(--ink)', boxShadow: 'none', marginTop: 18 }}
            onClick={() => { unarchiveProject(project.id); showToast('プロジェクトを一覧に戻しました'); onClose(); }}
          >
            アーカイブから戻す
          </button>
        ) : (
          <button
            className="pillbtn"
            style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 18 }}
            onClick={() => setConfirmArchive(true)}
          >
            プロジェクトをアーカイブ
          </button>
        )}
        <button
          className="pillbtn"
          style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 10 }}
          onClick={() => setConfirmDelete(true)}
        >
          プロジェクトを削除する
        </button>
      </BottomSheet>
      <AppAlert
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="このプロジェクトをアーカイブしますか？"
        message="一覧やカレンダーの帯からは外れますが、紐づくタスク・学習記録は保持されます。"
        confirmLabel="アーカイブする"
        onConfirm={() => { archiveProject(project.id); showToast('プロジェクトをアーカイブしました'); onClose(); }}
      />
      <AppAlert
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="このプロジェクトを削除しますか？"
        message="紐づくタスクは削除されず「プロジェクトなし」になります。学習記録も保持されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={() => {
          const removed = project;
          const taskIds = data.tasks.filter((t) => t.projectId === project.id).map((t) => t.id);
          deleteProject(project.id);
          showToast('プロジェクトを削除しました', () => restoreProject(removed, taskIds));
          onClose();
        }}
      />
      <ProjectCalendarSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        projectName={project.name}
        msByDay={stats.msByDay}
        startDate={project.startDate}
        endDate={project.endDate}
      />
    </>
  );
}
