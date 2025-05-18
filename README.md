# TaskMaster Pro - Enhanced To-Do & Project Manager

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

TaskMaster Pro is a full-stack web application designed to help users efficiently manage personal projects and daily tasks. Built with the PERN stack, it allows users to create projects, add tasks with details like due dates and priorities, and mark tasks as complete. This project serves as a practical demonstration of building a robust, user-friendly task management application.

---

## 🌟 Key Features (MVP)

The Minimum Viable Product (MVP) focuses on core task and project management functionalities:

*   **🔑 User Authentication:**
    *   User Registration
    *   User Login (using JWT)
    *   User Logout
    *   Protected Routes (API and Frontend)
*   **🗂️ Project Management:**
    *   Create Project
    *   View User's Projects
    *   Update Project Details
    *   Delete Project (with cascade delete for tasks)
*   **✔️ Task Management:**
    *   Create Task (within a project)
    *   View Tasks (for a selected project)
    *   Update Task Details
    *   Mark Task Complete/Incomplete
    *   Delete Task
    *   Task Ownership (tied to project ownership)

---

## 🛠️ Tech Stack

*   **💻 Frontend:** React.js (with Vite)
    *   State Management: React Context API
    *   Routing: React Router DOM
    *   HTTP Client: Axios
    *   Styling: WiP (Work in Progress)
*   **⚙️ Backend:** Node.js with Express.js
    *   API: RESTful API
    *   Authentication: JWT (jsonwebtoken)
    *   Password Hashing: bcrypt.js
*   **💾 Database:** PostgreSQL
    *   ORM/Query Builder: Sequelize

---

## 🚀 Getting Started: Setup and Installation

Follow these steps to get TaskMaster Pro running locally:

### 1. Prerequisites

Ensure you have the following installed:

*   Node.js (LTS recommended) & npm (or yarn)
*   Git
*   PostgreSQL (and a running server instance)

### 2. Clone the Repository

```bash
git clone https://github.com/zrebhi/TaskMaster-Pro
cd TaskMaster-Pro
```

### 3. Backend Setup ⚙️

Navigate to the backend directory:
```bash
cd backend
```

Install backend dependencies:
```bash
npm install
# or
# yarn install
```

**Environment Configuration:**
Create a `.env` file in the `backend/` directory. Copy contents from `.env.example` and configure your database connection and `JWT_SECRET`.
```bash
cp .env.example .env
# Now edit .env with your credentials
```

### 4. Database Setup 💾

Ensure your PostgreSQL server is running.

Connect to your PostgreSQL server (e.g., using `psql`) and create the database specified in your `backend/.env` (default: `taskmaster_pro_db`).
```sql
-- Example SQL commands (adjust user/password as per your .env)
-- Connect as postgres superuser first if needed: sudo -u postgres psql

CREATE DATABASE taskmaster_pro_db;
-- CREATE USER your_postgres_user WITH PASSWORD 'your_postgres_password'; -- Use values from .env
-- GRANT ALL PRIVILEGES ON DATABASE taskmaster_pro_db TO your_postgres_user;
-- ALTER DATABASE taskmaster_pro_db OWNER TO your_postgres_user; -- If user created
```
*(Note: For local development, using the default `postgres` user might suffice, but creating a dedicated user is good practice.)*

Navigate to the `backend` directory and run database migrations:
```bash
# Ensure you are in the 'backend' directory
npx sequelize-cli db:migrate
```

### 5. Frontend Setup 💻

Navigate to the frontend directory:
```bash
cd ../frontend # If in the backend directory
# or cd TaskMaster-Pro/frontend from the root
```

Install frontend dependencies:
```bash
npm install
# or
# yarn install
```

**API Proxy:**
Ensure `frontend/vite.config.js` is configured to proxy `/api` requests to your backend (default: `http://localhost:3001`).
```javascript
// Example snippet from vite.config.js
// ...
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001', // Your backend server
      changeOrigin: true,
      secure: false,
    },
  },
  port: 3000, // Or your preferred frontend port
},
// ...
```

### 6. Running the Application 🔥

Open two separate terminal windows:

**Terminal 1: Start Backend Server ⚙️**
```bash
cd backend
npm run dev
```
*(Backend defaults to `http://localhost:3001` or port in `backend/.env`)*

**Terminal 2: Start Frontend Development Server 💻**
```bash
cd frontend
npm run dev
```
*(Frontend defaults to `http://localhost:3000` or port in `vite.config.js`)*

You should now be able to access TaskMaster Pro in your browser.

---

## 📜 API Endpoints

Overview of available API endpoints:

### Authentication 🔑
*   `POST /api/auth/register` - Register a new user
*   `POST /api/auth/login` - Log in an existing user
*   `POST /api/auth/logout` - Log out the current user

### Projects 🗂️
*   `GET /api/projects` - List authenticated user's projects
*   `POST /api/projects` - Create a new project
*   `PUT /api/projects/:id` - Update an existing project
*   `DELETE /api/projects/:id` - Delete a project (and its tasks)

### Tasks ✔️
*   `GET /api/projects/:projectId/tasks` - List tasks for a specific project
*   `POST /api/projects/:projectId/tasks` - Create a new task within a project
*   `PUT /api/tasks/:id` - Update an existing task
*   `DELETE /api/tasks/:id` - Delete a task