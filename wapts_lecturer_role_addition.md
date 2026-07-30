# Architecture Revision — Introduce Level Coordinator Responsibility for Student Onboarding

## Objective

Refactor the student onboarding workflow to improve scalability by delegating student onboarding from the Head of Department (HOD) to designated **Level Coordinators**.

A Level Coordinator is **not** a new user type or entity. Instead, it is an **additional departmental responsibility assigned to selected Lecturers**.

This approach preserves a simple user model while allowing the department to distribute administrative responsibilities efficiently.

---

# Design Principles

- Maintain a single Lecturer entity.
- Do not create a separate "LevelCoordinator" user model.
- Treat Level Coordinator as an additional role/assignment.
- Preserve all normal Lecturer capabilities.
- Grant additional permissions only to lecturers assigned as Level Coordinators.
- Restrict coordinators to managing students within their assigned academic level(s).

---

# User Model

Retain the existing structure:

```
User
    ↓
Lecturer Profile
```

Do **not** create:

```
User
    ↓
LevelCoordinator
```

Instead, extend the Lecturer model with additional responsibility assignments.

Example:

```text
Lecturer

Additional Responsibilities:

✓ Level Coordinator
```

or

```text
Assigned Responsibilities

LECTURER

LEVEL_COORDINATOR
```

The implementation may use:

- Role assignments
- Permission flags
- Responsibility mappings

The underlying implementation is flexible as long as it remains extensible.

---

# Level Coordinator Assignment

The HOD should assign Level Coordinators.

Example workflow:

```
HOD Dashboard
        ↓
Manage Department Staff
        ↓
Select Lecturer
        ↓
Assign Responsibility
        ↓
Level Coordinator
        ↓
Assign Academic Level(s)
```

---

# Assigned Levels

Each Level Coordinator should manage one or more academic levels.

Examples:

```
100 Level
```

or

```
200 Level
```

or

```
Assigned Levels

100

200
```

Do not hardcode support for only one level.

The assignment model should allow future expansion to multiple levels if required.

---

# Student Onboarding Permissions

Only lecturers assigned the Level Coordinator responsibility should have access to:

- Student onboarding
- Student activation
- Student profile creation
- Student editing
- Student promotion (future feature)
- Level-specific student management

Ordinary lecturers must not have these permissions.

---

# Permission Matrix

## Lecturer

Can:

- View assigned courses
- Record attendance
- Create assessments
- Upload scores
- Submit results

Cannot:

- Onboard students
- Edit student records
- Manage student levels

---

## Lecturer + Level Coordinator

Can perform all Lecturer activities.

Additionally can:

- Onboard students
- Create student profiles
- Activate student accounts
- Edit student information
- Manage students within assigned level(s)

Cannot:

- Manage students outside assigned level(s)
- Assign Level Coordinators
- Manage department configuration

---

## Head of Department

Can:

- Assign Level Coordinators
- Remove Level Coordinators
- Override coordinator decisions
- Manage departmental configuration
- Manage curriculum
- Create courses
- Publish departmental results
- View departmental analytics

The HOD should no longer perform routine student onboarding.

---

# Student Onboarding Workflow

Replace the current workflow.

Current:

```
Administrator
        ↓
Creates Student
```

or

```
HOD
        ↓
Creates Student
```

New workflow:

```
Level Coordinator
        ↓
Student Onboarding
        ↓
Enter Student Information
        ↓
Assign Programme
        ↓
Assign Level
        ↓
Generate/Register Student Account
        ↓
Student Activated
```

---

# Access Restrictions

A Level Coordinator assigned to:

```
200 Level
```

must only be able to:

- View 200-level students
- Register 200-level students
- Edit 200-level students

Attempting to access:

```
100 Level
```

or

```
300 Level
```

must return an authorization error.

---

# HOD Dashboard Changes

Remove:

```
Student Registration
```

from the HOD's routine workflow.

Replace with:

```
Level Coordinators

Manage Assignments
```

The HOD should oversee the onboarding process rather than perform it directly.

---

# Lecturer Dashboard Changes

For ordinary lecturers:

Do not display Student Management.

For lecturers assigned as Level Coordinators:

Display an additional menu:

```
Student Management

• Pending Students
• Register Student
• Active Students
```

This menu should appear dynamically based on permissions.

---

# Backend Authorization

Introduce middleware or permission checks to verify:

- Lecturer has Level Coordinator responsibility.
- Requested student belongs to one of the coordinator's assigned levels.
- HOD retains full departmental override permissions.

Do not rely solely on frontend visibility.

All authorization must be enforced server-side.

---

# Database Changes

Do not introduce a new User type.

Instead extend the Lecturer profile with responsibility assignments.

Recommended additions:

```
responsibilities

assignedLevels
```

Example:

```json
{
    "responsibilities": [
        "LECTURER",
        "LEVEL_COORDINATOR"
    ],
    "assignedLevels": [
        200
    ]
}
```

This model remains flexible for future departmental responsibilities.

---

# Future Extensibility

This architecture should support future responsibilities such as:

- Examination Officer
- SIWES Coordinator
- Project Coordinator
- Postgraduate Coordinator
- Timetable Officer

These should also be implemented as additional responsibilities rather than new user types.

---

# Automated Testing

## Unit Tests

Verify:

- Responsibility assignment.
- Assigned level validation.
- Permission checks.
- Unauthorized access rejection.

---

## Integration Tests

Verify:

- HOD assigns Level Coordinator.
- Lecturer receives additional permissions.
- Student onboarding restricted by assigned level.
- HOD override functionality.

---

## End-to-End Tests

Verify:

```
HOD Login
        ↓
Assign Lecturer as Level Coordinator
        ↓
Assign Level
        ↓
Logout
        ↓
Coordinator Login
        ↓
Student Management Appears
        ↓
Register Student
        ↓
Student Stored Successfully
```

Negative scenarios:

- Ordinary lecturer cannot access Student Management.
- Coordinator cannot manage students outside assigned levels.
- Unauthorized requests return proper authorization errors.
- HOD retains full departmental access.

---

# Documentation

Update project documentation to include:

- Level Coordinator responsibility.
- Responsibility assignment workflow.
- Permission hierarchy.
- Student onboarding workflow.
- Assigned level restrictions.

Update architecture diagrams to reflect:

```
Administrator
        ↓
Creates HOD

HOD
        ↓
Approves Lecturer Requests
        ↓
Assigns Level Coordinators

Level Coordinator
        ↓
Onboards Students

Lecturer
        ↓
Teaching Activities
```

---

# Success Criteria

This revision is complete only when:

- No new "Level Coordinator" user type exists.
- Level Coordinator is implemented as an additional Lecturer responsibility.
- HOD assigns and manages Level Coordinators.
- Student onboarding is performed by Level Coordinators.
- Coordinators can manage only their assigned academic level(s).
- Ordinary lecturers cannot access student onboarding features.
- HOD retains full supervisory authority.
- Authorization is enforced on both frontend and backend.
- All Unit, Integration, and End-to-End tests pass successfully.
- The onboarding workflow scales efficiently for departments with large student populations.
