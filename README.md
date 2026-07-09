# SmartLearn LMS — AI-powered Learning, Revision, and Online Exam Platform

SmartLearn LMS is a premium, full-stack Learning Management System designed for modern educators and students. It integrates structured course delivery, syllabus organization, enrollment tracking, and interactive learning workspace features with strict role-based access control (RBAC), robust database indexing, and visual progress tracking.

---

## Technical Stack

* **Frontend**: Next.js 14 (App Router), React, Axios, Tailwind CSS, Lucide icons, React Hook Form, Zod.
* **Backend**: FastAPI (Python), SQLAlchemy ORM, Pydantic, Passlib (bcrypt), python-jose (JWT).
* **Database**: PostgreSQL 15, Alembic (database migrations).
* **Infrastructure**: Docker & Docker Compose.

---

## Key Features

1. **Secure RBAC & Sessions**: Short-lived JWT Bearer tokens (30 minutes) stored in localStorage and attached to all API requests automatically.
2. **Course Syllabus Engine**: Teachers can register courses, create structured chapters, and order lessons inside each chapter.
3. **Enrollment System**: Students browse the published catalog, enroll in courses with one-click, and unlock the corresponding lesson content.
4. **Lesson Workspace**: Embedded video players, text lectures, and lecture document downloading.
5. **Progress Persistence**: Students check off lessons as completed, recalculating progress percentages instantly.
6. **Robust Database Constraints**: Strict composite keys to prevent double-enrollments and progress logging duplicates.

---

## Directory Structure

```text
LMS/
├── backend/                  # FastAPI Backend application
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/              # API router dependencies & endpoints
│   │   ├── core/             # Settings, database setup, and JWT helpers
│   │   ├── crud/             # Database queries (User, Course, Progress, etc)
│   │   ├── models/           # SQLAlchemy DB entities
│   │   ├── schemas/          # Pydantic data schemas
│   │   └── main.py           # FastAPI entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js Frontend application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Page views)
│   │   ├── context/          # React Auth Context for global state
│   │   └── lib/              # API Axios Client config
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Docker orchestrator
├── .env.example              # Sample environment template
└── README.md
```

---

## Quick Start (Docker Setup)

### 1. Configure the Environment
Copy the example environment file and configure variables:
```bash
cp .env.example .env
```

### 2. Start the Application Containers
Run the following orchestrator command:
```bash
docker-compose up --build
```
* **FastAPI Backend Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Next.js Frontend Application**: [http://localhost:3000/](http://localhost:3000/)

---

## Database Migrations (Alembic)

Database schema setup and modifications must be controlled using Alembic. Ensure `AUTO_CREATE_TABLES=false` is set in your `.env` (it is disabled by default).

### Apply Migrations
Apply the initial migration script to create all tables:
```bash
docker-compose exec backend alembic upgrade head
```

### Generate a New Migration (For future additions)
If SQLAlchemy models are updated:
```bash
docker-compose exec backend alembic revision --autogenerate -m "describe_changes"
```

---

## Manual Test Flow & Accounts

### Test Accounts
You can register new accounts directly through the UI registration portal at [http://localhost:3000/register](http://localhost:3000/register) using either of the following roles:
* **Teacher Role**: Required to create courses, add chapters, and add lessons.
* **Student Role**: Required to browse, enroll, view lesson contents, and log progress.

### Core Testing Sequence
1. Open the Registration Page, select **Teacher**, and create a teacher account (e.g., `teacher@smartlearn.com`).
2. Log in and open the Teacher Dashboard.
3. Click **Create New Course**, input a title and description, and set the status to **Published**.
4. Click on the course to open the Course Editor. Add a **Chapter** (e.g., "Chapter 1: Basics") and add a **Lesson** (e.g., "Lesson 1.1: Getting Started" with content and a YouTube video URL).
5. Open a new incognito window, navigate to the Registration Page, select **Student**, and create a student account (e.g., `student@smartlearn.com`).
6. Log in and view the Student Catalog on the dashboard.
7. Click **Enroll** on the newly created course. Open the syllabus and click on the lesson to view the lecture.
8. Click **Mark as Completed** to test progress tracking and observe the progress bar update on your student dashboard.

---

## Project Roadmap

* **Phase 1**: Core RBAC, Register, Login, and Session management. (Completed)
* **Phase 2**: Courses, Chapters, Lessons, and Progress tracking. (Completed)
* **Phase 3**: Centralized Question Bank (Multiple Choice / True-False) managed by teachers.
* **Phase 4**: Timed Online Exams, Quiz sessions, scoring, and history analytics.
* **Phase 5**: AI-powered learning assistance, revision support, and admin system statistics.
