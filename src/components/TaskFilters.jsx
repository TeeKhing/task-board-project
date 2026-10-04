import './TaskFilters.css';

export const TaskFilters = ({ searchTerm, priority, onSearchChange, onPriorityChange }) => (
  <section className="task-filters" aria-label="Filter tasks">
    <label className="search-field" htmlFor="task-search">
      <span>Search tasks</span>
      <input
        id="task-search"
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search titles or descriptions"
      />
    </label>

    <label className="priority-filter" htmlFor="priority-filter">
      <span>Priority</span>
      <select
        id="priority-filter"
        value={priority}
        onChange={(event) => onPriorityChange(event.target.value)}
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="mid">Medium</option>
        <option value="low">Low</option>
      </select>
    </label>
  </section>
);