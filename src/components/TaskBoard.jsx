import './TaskBoard.css';
import { Fragment, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { TaskCard } from './TaskCard.jsx';

const priorityRank = { high: 3, mid: 2, low: 1 };

const TaskColumn = ({ column, tasks, onDeleteTask, onEditTask }) => {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const sortedTasks = [...tasks].sort((first, second) =>
    (priorityRank[second.priority] || priorityRank.mid) - (priorityRank[first.priority] || priorityRank.mid)
    || (first.position ?? 0) - (second.position ?? 0),
  );

  return (
    <div className={`column${isOver ? ' column-over' : ''}`} ref={setNodeRef}>
      <div className="column-header">
        <h2>{column.title}</h2>
        <span>{tasks.length}</span>
      </div>

      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <p className="empty-state">No tasks here yet.</p>
        ) : (
          sortedTasks.map((task, index) => (
            <Fragment key={task._id}>
              <TaskCard
                task={task}
                columnId={column.id}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
              {index < sortedTasks.length - 1 && <hr className="task-separator" />}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export const TaskBoard = ({ board, columns, loading, onDeleteTask, onMoveTask, onEditTask }) => {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  if (loading) return <p className="loading-state">Loading tasks...</p>;

  const activeTask = Object.values(board).flat().find((task) => task._id === activeTaskId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const pointerIntersections = pointerWithin(args);
        return pointerIntersections.length ? pointerIntersections : closestCorners(args);
      }}
      onDragStart={({ active }) => setActiveTaskId(active.id)}
      onDragCancel={() => setActiveTaskId(null)}
      onDragEnd={({ active, over }) => {
        setActiveTaskId(null);
        if (!over) return;

        const overColumn = columns.find((column) => column.id === over.id);
        const overTask = Object.values(board).flat().find((task) => task._id === over.id);
        const destinationColumnId = overColumn?.id || overTask?.columnId;
        if (destinationColumnId) {
          onMoveTask(active.id, destinationColumnId, overTask?._id || null);
        }
      }}
    >
      <section className="board" aria-label="Task board columns">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={board[column.id]}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        ))}
      </section>
      <DragOverlay>
        {activeTask && <div className="drag-preview">{activeTask.title}</div>}
      </DragOverlay>
    </DndContext>
  );
};