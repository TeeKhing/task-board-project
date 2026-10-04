import { useEffect, useState } from 'react';
import './TaskModal.css';

const createInitialForm = (task) => ({
  title: task?.title || '',
  description: task?.description || '',
  priority: task?.priority || 'mid',
  dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
});

export const TaskModal = ({ task, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(() => createInitialForm(task));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    const saved = await onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      dueDate: formData.dueDate || null,
    }, task);
    setIsSaving(false);
    if (saved) onClose();
  };

  return (
    <div className="task-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <header className="task-modal-header">
          <div>
            <p className="eyebrow">Task details</p>
            <h2 id="task-modal-title">{task ? 'Edit task' : 'Add a task'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose} disabled={isSaving}>
            ×
          </button>
        </header>

        <form className="task-modal-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="modal-title">Task title</label>
            <input
              autoFocus
              id="modal-title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="What needs to get done?"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="modal-description">Notes and procedures</label>
            <textarea
              id="modal-description"
              name="description"
              rows="6"
              value={formData.description}
              onChange={handleChange}
              placeholder={'Add detailed steps, context, and notes.\nFor subtasks, add one list item per line:\n- [ ] Research requirements'}
            />
            <span className="field-hint">
              Add subtasks as bullet or numbered lines. Use [x] to mark a subtask complete.
            </span>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="modal-priority">Priority</label>
              <select id="modal-priority" name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="mid">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="modal-due-date">Due date</label>
              <input id="modal-due-date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} />
            </div>
          </div>

          <footer className="task-modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={isSaving || !formData.title.trim()}>
              {isSaving ? 'Saving...' : task ? 'Save changes' : 'Add task'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};