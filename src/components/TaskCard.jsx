import './TaskCard.css';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const TaskCard = ({ task, columnId, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { columnId },
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: task._id });
  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };
  const setCardRef = (node) => {
    setNodeRef(node);
    setDropRef(node);
  };

  return (
  <article className="task-card" ref={setCardRef} style={cardStyle}>
    <div className="task-content">
      <h3>{task.title}</h3>
      <small>
        {task.dueDate
          ? `Due ${new Date(task.dueDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`
          : 'No due date'}
      </small>
    </div>

    <div className="task-card-tools">
      <button
        className="icon-button drag-handle"
        type="button"
        aria-label={`Drag ${task.title}`}
        title="Drag task to reorder or change status"
        {...listeners}
        {...attributes}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.4" />
          <circle cx="13" cy="5" r="1.4" />
          <circle cx="7" cy="10" r="1.4" />
          <circle cx="13" cy="10" r="1.4" />
          <circle cx="7" cy="15" r="1.4" />
          <circle cx="13" cy="15" r="1.4" />
        </svg>
      </button>
      <button
        className="icon-button edit-btn"
        type="button"
        aria-label={`Edit ${task.title}`}
        title="Edit task"
        onClick={() => onEdit(task)}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12.7 4.3 3 3M4 16l3.6-.7L16 6.9a2.1 2.1 0 0 0-3-3l-8.4 8.4L4 16Z" />
        </svg>
      </button>
      <button
        className="icon-button danger-btn"
        type="button"
        aria-label={`Delete ${task.title}`}
        title="Delete task"
        onClick={() => onDelete(task._id)}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.7 10H6.2l-.7-10m3 2.5v5m3-5v5" />
        </svg>
      </button>
    </div>
  </article>
  );
};