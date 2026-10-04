# Task Board 1.0 1.0

A React task board for organizing tasks, tracking progress, and keeping task notes.
Task Board is a React application for managing tasks across a simple workflow. Create tasks, add detailed notes and subtasks, set due dates and priorities, and track progress from To Do to Done. Tasks can be used locally as a guest or associated with an account through the Node.js and MongoDB API.

## Features

- Organize tasks by To Do, Doing, and Done.
- Set priorities and due dates.
- Drag tasks to reorder or change status.
- Add notes and subtasks to tasks.
- View the task pipeline and notes.
- Sign in, create an account, or continue as a guest.

## Run locally
### Workflow summary

- Organize tasks in three vertically stacked states: **To Do**, **Doing**, and **Done**.
- Each task appears as a compact row with its title, due date, and drag, edit, and delete controls.
- Rows are ordered by priority, with higher-priority tasks first.
- Drag a task to reorder it within a state or move it into another state.
- Search task titles and notes, and filter the board by priority.
- View totals for all tasks, tasks in progress, and completed tasks.

### Pipeline and notes

- The **Pipeline** view orders tasks by earliest due date. Tasks sharing a due date are ordered by priority; tasks without a due date follow dated tasks.
- The task details field is used for detailed notes, procedures, and subtask lists.
- Bullet and numbered list entries in the details field are displayed as subtasks in the Pipeline.
- Use `[ ]` for an incomplete checklist item and `[x]` for a completed item, for example:

  ```text
  Prepare release
  - [ ] Verify the changes
  1. Update the documentation
  - [x] Notify the team
  ```

- The **Notes** view displays each task's complete details text.

### Accounts and guest mode

- Create an account with an email address and password, or sign in to an existing account.
- Account tasks are stored by the backend and associated with the signed-in account.
- Guest tasks are saved in browser local storage.
- **Continue without an account** opens the board in guest mode; sample tasks are available when no guest tasks have been saved.
- **Sign out** returns the app to the sign-in screen.

## Technology

- **Frontend:** React, Vite, and `@dnd-kit` for drag and drop.
- **Backend:** Node.js, Express, and Mongoose.
- **Database:** MongoDB.
- **Authentication:** bcrypt password hashing and signed JSON Web Tokens.

## Project structure

```text
.
├── src/
│   ├── components/       # Board, task forms, notes, pipeline, and account screens
│   └── services/         # Frontend API clients
├── backend/
│   ├── config/           # MongoDB connection
│   ├── middleware/       # Authentication middleware
│   ├── models/           # Account and task models
│   └── routes/           # Authentication and task APIs
├── .env                  # Frontend Vite configuration (local, ignored by Git)
└── backend/.env          # Backend configuration (local, ignored by Git)
```

## Local setup

### Configure environment

Create or edit the environment files locally; do not commit them.

The project-root `.env` contains the frontend API address:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

The `backend/.env` contains backend settings:

```dotenv
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-private-secret
```

Set `MONGODB_URI` to the MongoDB database you intend to use. Set `JWT_SECRET` to a unique, private value of at least 32 characters. Do not reuse credentials that have been shared or exposed.

### Start the frontend

From the project root:

```sh
npm install
npm run dev
```

Vite prints the local address where the application is available.

### Start the backend

In a second terminal, from the `backend` directory:

```sh
npm install
npm run dev
```

The backend loads configuration from `backend/.env` and listens on the configured port. The frontend `VITE_API_URL` should point to that API.

## API overview

All routes are prefixed with `/api`. Authentication routes are under `/auth`, and task routes are under `/tasks`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create an account and return a signed-in session |
| `POST` | `/api/auth/login` | Sign in and return a session |
| `GET` | `/api/auth/me` | Return the current account for a valid token |
| `POST` | `/api/auth/logout` | Logout endpoint |
| `GET` | `/api/tasks` | List the signed-in user's tasks |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

Task API requests require a bearer token. The backend associates created tasks with the authenticated account and checks task ownership when updating or deleting them.

## Common commands

Run these from the project root:

```sh
npm run dev       # Start the Vite development server
npm run build     # Create a production frontend build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```
