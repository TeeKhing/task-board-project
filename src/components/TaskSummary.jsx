import './TaskSummary.css';

export const TaskSummary = ({ tasks }) => {
  const inProgressCount = tasks.filter((task) => task.columnId === 'doing').length;
  const completedCount = tasks.filter((task) => task.columnId === 'done').length;

  return (
    <section className="task-summary" aria-label="Task summary">
      <div>
        <span className="summary-label">Total tasks</span>
        <strong>{tasks.length}</strong>
      </div>
      <div>
        <span className="summary-label">In progress</span>
        <strong>{inProgressCount}</strong>
      </div>
      <div>
        <span className="summary-label">Completed</span>
        <strong>{completedCount}</strong>
      </div>
    </section>
  );
};