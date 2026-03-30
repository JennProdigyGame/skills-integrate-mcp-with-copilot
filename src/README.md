# Mergington High School Activities API

A super simple FastAPI application that allows students to view extracurricular activities while only logged-in teachers can manage registrations.

## Features

- View all available extracurricular activities
- Teacher-only registration and unregister actions
- Simple teacher login/logout flow backed by `teachers.json`
- View participant lists and remaining spots

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   uvicorn app:app --reload
   ```

3. Open your browser and go to:
   - App UI: http://localhost:8000/static/index.html
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Demo Teacher Credentials

The demo teacher usernames and passwords are stored in `teachers.json`:

- `coach.miller` / `mergington123`
- `principal.jones` / `schoolpride456`

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/activities` | Get all activities with their details and current participant count |
| GET | `/auth/status` | Check whether a teacher is logged in |
| POST | `/auth/login` | Log in as a teacher |
| POST | `/auth/logout` | Log out the current teacher |
| POST | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity (teacher only) |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Remove a student from an activity (teacher only) |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Teachers** - Stored in `teachers.json`:
   - Username
   - Password
   - Display name

All activity data is still stored in memory, which means registrations reset when the server restarts.
