import { useAppState } from '../state/AppStateContext';
import { PencilIcon, PlusIcon } from './Icons';
import type { GroupProject, Subject } from '../state/types';

export function ProjectDrawer({
  open, onClose, selectedSubjectId, onSelectSubject, onAddSubject, onAddProject, onOpenProject, onEditSubject,
}: {
  open: boolean;
  onClose: () => void;
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  onAddSubject: () => void;
  onAddProject: () => void;
  onOpenProject: (project: GroupProject) => void;
  onEditSubject: (subject: Subject) => void;
}) {
  const { data } = useAppState();
  const activeSubjects = data.subjects.filter((s) => !s.archived);
  const archivedSubjects = data.subjects.filter((s) => s.archived);
  const activeProjects = data.projects.filter((p) => !p.archived);
  const archivedProjects = data.projects.filter((p) => p.archived);

  const countForSubject = (subjectId: string | null) =>
    data.tasks.filter((t) => !t.completed && (subjectId === null || t.subjectId === subjectId)).length;
  const countForProject = (projectId: string) =>
    data.tasks.filter((t) => !t.completed && t.projectId === projectId).length;

  return (
    <>
      <div className={`drawer-scrim${open ? ' show' : ''}`} onClick={onClose} />
      <div className={`drawer-panel${open ? ' show' : ''}`}>
        <div className="drawer-head">
          <p className="drawer-title">教科</p>
          <p className="drawer-sub">タップして絞り込み・鉛筆で編集</p>
        </div>
        <div className="drawer-list">
          <button
            className={`drawer-row${selectedSubjectId === null ? ' active' : ''}`}
            onClick={() => { onSelectSubject(null); onClose(); }}
          >
            <div className="drawer-avatar" style={{ background: 'var(--ink)' }}>全</div>
            <span className="drawer-row-name">すべてのタスク</span>
            <span className="drawer-row-count">{countForSubject(null)}</span>
          </button>

          <div className="drawer-section-row">
            <p className="drawer-section-label">教科</p>
            <button className="drawer-section-add" aria-label="新しい教科を追加" onClick={onAddSubject}>
              <PlusIcon size={14} />
            </button>
          </div>
          {activeSubjects.map((s) => (
            <div key={s.id} className={`drawer-row-wrap${selectedSubjectId === s.id ? ' active' : ''}`}>
              <button className="drawer-row" style={{ flex: 1 }} onClick={() => { onSelectSubject(s.id); onClose(); }}>
                <div className="drawer-avatar" style={{ background: s.color }}>{s.name.slice(0, 1)}</div>
                <span className="drawer-row-name">{s.name}</span>
                <span className="drawer-row-count">{countForSubject(s.id)}</span>
              </button>
              <button className="drawer-edit-btn" aria-label={`${s.name}を編集`} onClick={() => onEditSubject(s)}>
                <PencilIcon size={13} />
              </button>
            </div>
          ))}
          {activeSubjects.length === 0 && (
            <p className="cal-hint" style={{ margin: '2px 8px 8px', textAlign: 'left' }}>まだ教科がありません。＋から追加できます</p>
          )}

          <div className="drawer-section-row">
            <p className="drawer-section-label">プロジェクト</p>
            <button className="drawer-section-add" aria-label="新しいプロジェクトを追加" onClick={onAddProject}>
              <PlusIcon size={14} />
            </button>
          </div>
          {activeProjects.map((p) => (
            <button key={p.id} className="drawer-row" onClick={() => { onOpenProject(p); onClose(); }}>
              <div className="drawer-avatar" style={{ background: p.color }} />
              <span className="drawer-row-name">{p.name}</span>
              <PencilIcon size={12} />
              <span className="drawer-row-count">{countForProject(p.id)}</span>
            </button>
          ))}
          {activeProjects.length === 0 && (
            <p className="cal-hint" style={{ margin: '2px 8px 8px', textAlign: 'left' }}>まだプロジェクトがありません。＋から追加できます</p>
          )}

          {archivedSubjects.length > 0 && (
            <>
              <p className="drawer-section-label">アーカイブ済みの教科</p>
              {archivedSubjects.map((s) => (
                <div key={s.id} className="drawer-row-wrap">
                  <button className="drawer-row archived" style={{ flex: 1 }} onClick={() => onEditSubject(s)}>
                    <div className="drawer-avatar" style={{ background: 'var(--ink-faint)' }}>{s.name.slice(0, 1)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="drawer-row-name" style={{ color: 'var(--ink-faint)' }}>{s.name}</span>
                      <span className="drawer-row-archived-note">新規タスクの候補には出ません・過去の記録は保持されます</span>
                    </div>
                  </button>
                </div>
              ))}
              <p className="cal-hint" style={{ margin: '10px 8px 0', textAlign: 'left' }}>
                教科を削除すると「アーカイブ済み」に移動します。タイムラインや統計に残っている過去の記録が消えることはありません。タップで復元できます
              </p>
            </>
          )}

          {archivedProjects.length > 0 && (
            <>
              <p className="drawer-section-label">アーカイブ済みのプロジェクト</p>
              {archivedProjects.map((p) => (
                <div key={p.id} className="drawer-row-wrap">
                  <button className="drawer-row archived" style={{ flex: 1 }} onClick={() => { onOpenProject(p); onClose(); }}>
                    <div className="drawer-avatar" style={{ background: 'var(--ink-faint)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="drawer-row-name" style={{ color: 'var(--ink-faint)' }}>{p.name}</span>
                      <span className="drawer-row-archived-note">カレンダーの帯からは外れます・過去の記録は保持されます</span>
                    </div>
                  </button>
                </div>
              ))}
              <p className="cal-hint" style={{ margin: '10px 8px 0', textAlign: 'left' }}>
                プロジェクトをアーカイブするとここに移動します。タップして開くと、アーカイブから戻すことができます
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
