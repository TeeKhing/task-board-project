import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { TaskModal } from './TaskModal.jsx';
import { TaskFilters } from './TaskFilters.jsx';
import { TaskBoard } from './TaskBoard.jsx';
import { TaskSummary } from './TaskSummary.jsx';
import { createTask, deleteTask, fetchTasks, updateTask } from '../services/taskApi';
import { createAccount, fetchCurrentUser, loginAccount } from '../services/authApi';
import { AuthScreen } from './AuthScreen.jsx';

const LOCAL_TASKS_KEY = 'task-board.tasks';

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

const fallbackTasks = [
  { _id: '1', title: 'Plan sprint goals', description: 'Review tasks for the week', columnId: 'todo', priority: 'high', dueDate: '2026-09-30' },
  { _id: '2', title: 'Create landing page wireframe', description: 'Draft structure and CTA layout', columnId: 'doing', priority: 'mid', dueDate: '2026-09-29' },
  { _id: '3', title: 'Ship final release notes', description: 'Summarize highlights and fixes', columnId: 'done', priority: 'low', dueDate: '2026-09-28' },
];

const priorityRank = { high: 3, mid: 2, low: 1 };

const formatPriority = (priority = 'mid') =>
  priority === 'mid' ? 'Medium' : `${priority[0].toUpperCase()}${priority.slice(1)}`;

const getSubtasks = (description = '') =>
  description.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(?:\[( |x|X)\]\s*)?(.+?)\s*$/);
    return match
      ? [{ title: match[2], completed: Boolean(match[1]?.trim()) }]
      : [];
  });

const compareByDueDateAndPriority = (first, second) => {
  const firstDate = first.dueDate ? new Date(first.dueDate).getTime() : Number.POSITIVE_INFINITY;
  const secondDate = second.dueDate ? new Date(second.dueDate).getTime() : Number.POSITIVE_INFINITY;
  const validFirstDate = Number.isFinite(firstDate) ? firstDate : Number.POSITIVE_INFINITY;
  const validSecondDate = Number.isFinite(secondDate) ? secondDate : Number.POSITIVE_INFINITY;

  return validFirstDate - validSecondDate
    || (priorityRank[second.priority] || priorityRank.mid) - (priorityRank[first.priority] || priorityRank.mid);
};

const formatDueDate = (dueDate) => {
  const date = dueDate ? new Date(dueDate) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'No due date';
};

const PipelineView = ({ tasks, columns, onEditTask }) => (
  <section className="pipeline" aria-label="Task pipeline ordered by due date and priority">
    {tasks.length === 0 ? (
      <p className="empty-state">No tasks match your filters.</p>
    ) : (
      tasks.map((task, index) => {
        const subtasks = getSubtasks(task.description);
        const column = columns.find((item) => item.id === task.columnId);

        return (
          <article className="pipeline-item" key={task._id}>
            <span className="pipeline-step" aria-label={`Step ${index + 1}`}>{index + 1}</span>
            <div className="pipeline-task">
              <div className="pipeline-task-heading">
                <div>
                  <span className={`priority priority-${task.priority || 'mid'}`}>
                    {formatPriority(task.priority)}
                  </span>
                  <span className={`pipeline-status pipeline-status-${task.columnId}`}>
                    {column?.title || 'To Do'}
                  </span>
                </div>
                <button type="button" className="pipeline-edit" onClick={() => onEditTask(task)}>Edit</button>
              </div>
              <h3>{task.title}</h3>
              <p className="pipeline-due">Due: {formatDueDate(task.dueDate)}</p>
              {subtasks.length > 0 && (
                <ul className="pipeline-subtasks" aria-label={`Subtasks for ${task.title}`}>
                  {subtasks.map((subtask, subtaskIndex) => (
                    <li key={`${task._id}-subtask-${subtaskIndex}`} className={subtask.completed ? 'subtask-complete' : ''}>
                      {subtask.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        );
      })
    )}
  </section>
);

const NotesView = ({ tasks, columns, onEditTask }) => (
  <section className="notes-list" aria-label="Task notes and procedures">
    {tasks.length === 0 ? (
      <p className="empty-state">No tasks match your filters.</p>
    ) : (
      tasks.map((task) => {
        const column = columns.find((item) => item.id === task.columnId);
        const subtasks = getSubtasks(task.description);

        return (
          <article className="note-entry" key={task._id}>
            <div className="note-entry-header">
              <div>
                <span className={`pipeline-status pipeline-status-${task.columnId}`}>
                  {column?.title || 'To Do'}
                </span>
                <h3>{task.title}</h3>
              </div>
              <button type="button" className="pipeline-edit" onClick={() => onEditTask(task)}>Edit</button>
            </div>
            {task.description ? (
              <p className="note-content">{task.description}</p>
            ) : (
              <p className="note-empty">No notes or procedures have been added.</p>
            )}
            {subtasks.length > 0 && (
              <p className="note-subtask-count">{subtasks.length} subtask{subtasks.length === 1 ? '' : 's'} listed</p>
            )}
          </article>
        );
      })
    )}
  </section>
);

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeView, setActiveView] = useState('overview');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const board = useMemo(
    () =>
      columns.reduce((acc, column) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        acc[column.id] = tasks.filter((task) => {
          const matchesColumn = task.columnId === column.id;
          const matchesPriority = priorityFilter === 'all' || (task.priority || 'mid') === priorityFilter;
          const searchableText = `${task.title} ${task.description || ''}`.toLowerCase();
          const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

          return matchesColumn && matchesPriority && matchesSearch;
        }).sort((first, second) => (first.position ?? 0) - (second.position ?? 0));
        return acc;
      }, {}),
    [tasks, searchTerm, priorityFilter],
  );
  const visibleTasks = useMemo(() => columns.flatMap((column) => board[column.id]), [board]);
  const pipelineTasks = useMemo(
    () => [...visibleTasks].sort(compareByDueDateAndPriority),
    [visibleTasks],
  );

  useEffect(() => {
    const loadTasks = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        try {
          const storedTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY));
          setTasks(Array.isArray(storedTasks) ? storedTasks : fallbackTasks);
        } catch {
          setTasks(fallbackTasks);
        }
        setLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        const data = await fetchTasks();
        setAuthUser(user);
        setTasks(data);
      } catch (err) {
        setError(err.message || 'Unable to load tasks');
        localStorage.removeItem('token');
        try {
          const storedTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY));
          setTasks(Array.isArray(storedTasks) ? storedTasks : fallbackTasks);
        } catch {
          setTasks(fallbackTasks);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    if (loading || !isGuestSession) return;

    try {
      localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
    } catch (storageError) {
      console.error('Unable to save tasks in this browser', storageError);
    }
  }, [tasks, loading, isGuestSession]);

  const handleAuthenticate = async (mode, credentials) => {
    const authResult = mode === 'signup'
      ? await createAccount(credentials)
      : await loginAccount(credentials);

    localStorage.setItem('token', authResult.token);
    setAuthUser(authResult.user);
    setIsGuestSession(false);
    try {
      const accountTasks = await fetchTasks();
      setTasks(accountTasks);
      setError('');
    } catch (requestError) {
      setTasks([]);
      setError(`Signed in, but tasks could not be loaded: ${requestError.message}`);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setAuthUser(null);
    setIsGuestSession(false);
    setError('');
    try {
      const storedTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS_KEY));
      setTasks(Array.isArray(storedTasks) ? storedTasks : fallbackTasks);
    } catch {
      setTasks(fallbackTasks);
    }
  };

  const handleContinueAsGuest = () => {
    setAuthUser(null);
    setIsGuestSession(true);
    setError('');
  };

  const handleSaveTask = async (taskData, taskToEdit) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (taskToEdit) {
          setTasks((previousTasks) => previousTasks.map((task) =>
            task._id === taskToEdit._id ? { ...task, ...taskData } : task,
          ));
          return true;
        }

        const newTask = {
          _id: crypto.randomUUID(),
          ...taskData,
          columnId: 'todo',
        };
        setTasks((prev) => [newTask, ...prev]);
        return true;
      }

      if (taskToEdit) {
        const savedTask = await updateTask(taskToEdit._id, taskData);
        setTasks((previousTasks) => previousTasks.map((task) =>
          task._id === taskToEdit._id ? { ...task, ...taskData, ...(savedTask || {}) } : task,
        ));
      } else {
        const savedTask = await createTask(taskData);
        setTasks((prev) => [savedTask, ...prev]);
      }
      return true;
    } catch (err) {
      setError(err.message || 'Could not create task');
      return false;
    }
  };

  const handleMoveTask = async (taskId, destinationColumnId, beforeTaskId = null) => {
    const currentTask = tasks.find((task) => task._id === taskId);
    if (!currentTask) return;

    const destinationColumn = columns.find((column) => column.id === destinationColumnId);
    if (!destinationColumn) return;

    const sourceTasks = tasks
      .filter((task) => task.columnId === currentTask.columnId)
      .sort((first, second) => (first.position ?? 0) - (second.position ?? 0));
    const destinationTasks = destinationColumn.id === currentTask.columnId
      ? sourceTasks
      : tasks
        .filter((task) => task.columnId === destinationColumn.id)
        .sort((first, second) => (first.position ?? 0) - (second.position ?? 0));
    const remainingSourceTasks = sourceTasks.filter((task) => task._id !== taskId);
    const nextDestinationTasks = destinationColumn.id === currentTask.columnId
      ? remainingSourceTasks
      : [...destinationTasks];
    const insertionIndex = beforeTaskId
      ? nextDestinationTasks.findIndex((task) => task._id === beforeTaskId)
      : nextDestinationTasks.length;

    nextDestinationTasks.splice(insertionIndex < 0 ? nextDestinationTasks.length : insertionIndex, 0, currentTask);

    if (
      destinationColumn.id === currentTask.columnId
      && nextDestinationTasks.every((task, index) => task._id === sourceTasks[index]?._id)
    ) {
      return;
    }

    const tasksWithPositions = new Map();
    remainingSourceTasks.forEach((task, position) => {
      tasksWithPositions.set(task._id, { ...task, position });
    });
    nextDestinationTasks.forEach((task, position) => {
      tasksWithPositions.set(task._id, {
        ...task,
        columnId: destinationColumn.id,
        position,
      });
    });
    const nextTasks = tasks.map((task) => tasksWithPositions.get(task._id) || task);
    const changedTasks = nextTasks.filter((task) => {
      const previousTask = tasks.find((item) => item._id === task._id);
      return task.position !== previousTask.position || task.columnId !== previousTask.columnId;
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTasks(nextTasks);
        return;
      }

      const savedTasks = await Promise.all(changedTasks.map((task) =>
        updateTask(task._id, { columnId: task.columnId, position: task.position }),
      ));
      const savedById = new Map(savedTasks.map((task) => [task._id, task]));
      setTasks(nextTasks.map((task) => ({ ...task, ...(savedById.get(task._id) || {}) })));
    } catch (err) {
      setError(err.message || 'Could not update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        return;
      }

      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (err) {
      setError(err.message || 'Could not delete task');
    }
  };

  if (loading) {
    return <main className="auth-screen"><p className="loading-state">Loading your task board...</p></main>;
  }

  if (!authUser && !isGuestSession) {
    return (
      <>
        {error && <p className="auth-load-error" role="alert">{error}</p>}
        <AuthScreen
          onAuthenticate={handleAuthenticate}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="site-brand">
          <span className="site-title">Task Board 1.0</span>
        </div>

        <nav aria-label="Main navigation">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'notes', label: 'Notes' },
          ].map((view) => (
            <a
              key={view.id}
              href={`#${view.id}`}
              className={activeView === view.id ? 'nav-active' : ''}
              aria-current={activeView === view.id ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setActiveView(view.id);
              }}
            >
              {view.label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <span className="token-status">{authUser ? authUser.email : 'Local mode'}</span>
          {authUser && (
            <button className="secondary-button sign-out-button" type="button" onClick={handleSignOut}>
              Sign out
            </button>
          )}
          <button className="primary-button" type="button" onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}>
            Add task
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar-panel">
          <div className="panel-header-small">
            <h2>Project pulse</h2>
            <span className="panel-tag">Live</span>
          </div>

          <TaskSummary tasks={tasks} />
          <TaskFilters
            searchTerm={searchTerm}
            priority={priorityFilter}
            onSearchChange={setSearchTerm}
            onPriorityChange={setPriorityFilter}
          />

          {error && <div className="error-banner">{error}</div>}
        </aside>

        <main className={`board-panel view-${activeView}`}>
          <div className="board-header">
            <div>
              <p className="eyebrow">{activeView === 'overview' ? 'Status at a glance' : 'Task details'}</p>
              <h2>{activeView === 'overview' ? 'Workflow summary' : activeView === 'pipeline' ? 'Task pipeline' : 'Task notes'}</h2>
            </div>
            <div className="board-header-actions">
              <button className="primary-button" type="button" onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}>
                Add task
              </button>
            </div>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}
          {activeView === 'overview' && (
            <TaskBoard
              board={board}
              columns={columns}
              loading={loading}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          )}
          {activeView === 'pipeline' && (
            loading
              ? <p className="loading-state">Loading tasks...</p>
              : <PipelineView
                tasks={pipelineTasks}
                columns={columns}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
              />
          )}
          {activeView === 'notes' && (
            loading
              ? <p className="loading-state">Loading tasks...</p>
              : <NotesView
                tasks={visibleTasks}
                columns={columns}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
              />
          )}
        </main>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          key={editingTask?._id || 'new-task'}
          task={editingTask}
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={handleSaveTask}
        />
      )}
    </div>
  );
}

export default App;
