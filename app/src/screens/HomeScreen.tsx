import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { DraggableTaskGroup } from '../components/DraggableTaskGroup';
import { MenuIcon, FlameIcon, CloseIcon, PlusIcon, ClockIcon, RepeatIcon } from '../components/Icons';
import { useToast } from '../components/Overlay';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { AddSubjectSheet } from '../components/AddSubjectSheet';
import { AddProjectSheet } from '../components/AddProjectSheet';
import { ProjectDetailSheet } from '../components/ProjectDetailSheet';
import { SubjectDetailSheet } from '../components/SubjectDetailSheet';
import type { GroupProject, Subject, Task } from '../state/types';
import { addDays, formatDateJa, formatDuration, isSameDay, startOfDay } from '../lib/format';
import { currentStreakDays, sessionsOnDay, startOfWeek, totalMs, weeklyTotals } from '../lib/stats';
import { useTimer } from '../state/TimerContext';

type FilterKey = 'all' | 'dueSoon' | 'done';

export function HomeScreen() {
  const { data, updateTask } = useAppState();
  const { showToast } = useToast();
  const timer = useTimer();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<GroupProject | null>(null);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const weekStart = startOfWeek(now);
  const totals = weeklyTotals(data.sessions, weekStart);
  const weeklyMs = totals.reduce((a, b) => a + b, 0);
  const weeklyPct = Math.min(100, Math.round((weeklyMs / (data.settings.weeklyGoalMinutes * 60000)) * 100) || 0);
  const streak = currentStreakDays(data.sessions, now);
  const todaySessionsMs = totalMs(sessionsOnDay(data.sessions, today));
  const activeSubject = subjectFilter ? data.subjects.find((s) => s.id === subjectFilter) : null;

  const visibleTasks = useMemo(() => {
    let list = data.tasks;
    if (subjectFilter) list = list.filter((t) => t.subjectId === subjectFilter);
    if (filter === 'done') list = list.filter((t) => t.completed);
    else if (filter === 'dueSoon') {
      list = list.filter((t) => !t.completed).slice().sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
    } else {
      list = list.slice().sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.order - b.order;
      });
    }
    return list;
  }, [data.tasks, filter, subjectFilter]);

  const groups = useMemo(() => {
    if (filter === 'dueSoon' || filter === 'done') {
      return [{ label: filter === 'done' ? '完了済み' : '締切が近い順', tasks: visibleTasks }];
    }
    const todayTasks = visibleTasks.filter((t) => t.dueAt !== null && isSameDay(new Date(t.dueAt), today));
    const tomorrowTasks = visibleTasks.filter((t) => t.dueAt !== null && isSameDay(new Date(t.dueAt), tomorrow));
    const laterTasks = visibleTasks.filter((t) => t.dueAt !== null && new Date(t.dueAt) > tomorrow && !isSameDay(new Date(t.dueAt), tomorrow));
    const noDueTasks = visibleTasks.filter((t) => t.dueAt === null);
    const overdueTasks = visibleTasks.filter((t) => t.dueAt !== null && new Date(t.dueAt) < today && !isSameDay(new Date(t.dueAt), today) && !t.completed);
    const out: { label: string; tasks: Task[] }[] = [];
    if (overdueTasks.length) out.push({ label: '期限切れ', tasks: overdueTasks });
    if (todayTasks.length) out.push({ label: '今日', tasks: todayTasks });
    if (tomorrowTasks.length) out.push({ label: '明日', tasks: tomorrowTasks });
    if (laterTasks.length) out.push({ label: 'それ以降', tasks: laterTasks });
    if (noDueTasks.length) out.push({ label: '期限なし', tasks: noDueTasks });
    return out;
  }, [visibleTasks, filter, today, tomorrow]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkReview = (enabled: boolean) => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => updateTask(id, { reviewEnabled: enabled }));
    showToast(`${count}件のタスクの自動復習を${enabled ? 'ON' : 'OFF'}にしました`);
    exitSelectionMode();
  };

  return (
    <div className="content">
      <div className="scroll">
        <div className="hero">
          <div className="hero-glow"><span className="g1" /><span className="g2" /><span className="g3" /></div>
          <div className="hero-top">
            <p className="eyebrow eyebrow-lg">{formatDateJa(now)}</p>
            <button className="avatar-btn" aria-label="教科ドロワーを開く" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </button>
          </div>
          <div className="clock-row">
            <span className="clock">{String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}</span>
            <span className="clock-sub">{todaySessionsMs > 0 ? '学習中' : 'さあ始めましょう'}</span>
          </div>
          <div className="hero-stats">
            <div className="hero-stat hero-stat-accent">
              <span className="ring" style={{ background: `conic-gradient(#fff 0 ${weeklyPct}%, rgba(255,255,255,.35) 0)` }} />
              <span className="hero-stat-val">{weeklyPct}%</span>
              <span className="hero-stat-label">今週の目標</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon"><ClockIcon color="var(--indigo)" /></span>
              <span className="hero-stat-val">{todaySessionsMs > 0 ? formatDuration(todaySessionsMs) : '0分'}</span>
              <span className="hero-stat-label">今日の学習</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon"><FlameIcon size={15} /></span>
              <span className="hero-stat-val">{streak}日</span>
              <span className="hero-stat-label">連続学習</span>
            </div>
          </div>
          {activeSubject && (
            <button className="pill hero-subject-pill" onClick={() => setSubjectFilter(null)}>
              {activeSubject.name} <CloseIcon size={10} />
            </button>
          )}
        </div>

        <div className="filter-sticky">
          <div className="chipbar">
            <button className={`filter-chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>すべて</button>
            <button className={`filter-chip${filter === 'dueSoon' ? ' active' : ''}`} onClick={() => setFilter('dueSoon')}>締切が近い順</button>
            <button className={`filter-chip${filter === 'done' ? ' active' : ''}`} onClick={() => setFilter('done')}>完了</button>
            <button
              className={`filter-chip select-toggle${selectionMode ? ' active' : ''}`}
              onClick={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
            >
              {selectionMode ? 'キャンセル' : '選択'}
            </button>
          </div>
        </div>

        <div className="list">
          {groups.length === 0 && (
            <div className="empty-state">タスクがありません。右下の＋から追加できます。</div>
          )}
          {groups.map((g) => (
            <div key={g.label}>
              <div className="day-label">{g.label} <span className="count">{g.tasks.length}件</span></div>
              <DraggableTaskGroup
                tasks={g.tasks}
                reorderable={filter === 'all' && !selectionMode}
                onOpenTimer={(t) => timer.start(t)}
                onOpenDetail={(t) => setDetailTask(t)}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelectId}
              />
            </div>
          ))}
          {groups.length > 0 && (
            <div className="swipe-hint-row">
              {selectionMode ? 'タップしてタスクを選択・下のボタンで自動復習を一括変更' : filter === 'all' ? '右端のハンドルをつかんで並び替え・タップで詳細を編集' : 'タップでタスクの詳細を開けます'}
            </div>
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selectedIds.size}件選択中</span>
          <div className="bulk-bar-actions">
            <button
              className="bulk-bar-btn on"
              disabled={selectedIds.size === 0}
              onClick={() => applyBulkReview(true)}
            >
              <RepeatIcon size={13} /> 自動復習ON
            </button>
            <button
              className="bulk-bar-btn off"
              disabled={selectedIds.size === 0}
              onClick={() => applyBulkReview(false)}
            >
              自動復習OFF
            </button>
          </div>
        </div>
      )}

      {!selectionMode && (
        <button
          className={`fab${timer.active?.minimized ? ' fab-lifted' : ''}`}
          aria-label="タスクを追加"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon />
        </button>
      )}

      <ProjectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedSubjectId={subjectFilter}
        onSelectSubject={setSubjectFilter}
        onAddSubject={() => { setDrawerOpen(false); setAddSubjectOpen(true); }}
        onAddProject={() => { setDrawerOpen(false); setAddProjectOpen(true); }}
        onOpenProject={(p) => setDetailProject(p)}
        onEditSubject={(s) => setEditSubject(s)}
      />

      <AddTaskSheet open={addOpen} onClose={() => setAddOpen(false)} onDone={() => setAddOpen(false)} />
      <TaskDetailSheet task={detailTask} onClose={() => setDetailTask(null)} />
      <AddSubjectSheet open={addSubjectOpen} onClose={() => setAddSubjectOpen(false)} />
      <AddProjectSheet open={addProjectOpen} onClose={() => setAddProjectOpen(false)} />
      <ProjectDetailSheet project={detailProject} onClose={() => setDetailProject(null)} />
      <SubjectDetailSheet subject={editSubject} onClose={() => setEditSubject(null)} />
    </div>
  );
}
