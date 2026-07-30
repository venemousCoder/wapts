# Architecture Revision — Transfer Course Management from Administrator to Head of Department (HOD)

## Objective

Revise the course management architecture by transferring ownership of **Course** and **Course Offering** management from the Administrator to the Head of Department (HOD).

The Administrator should remain responsible for institution-wide configuration, while the HOD should own all department-level academic operations.

This revision aligns course management with the existing departmental ownership model adopted for:

- Student Registration
- Lecturer Onboarding
- Result Approval

---

# Updated Responsibility Matrix

## Administrator

The Administrator manages institutional configuration only.

Responsibilities include:

- Manage HOD Accounts
- Manage Departments
- Manage Academic Sessions
- Manage Semesters
- Manage Grade Scales
- Manage Faculties (if implemented)
- Manage System Settings
- Configure Authentication
- View Institution-wide Analytics

The Administrator **shall not**:

- Create Courses
- Edit Courses
- Delete Courses
- Assign Lecturers
- Publish Course Offerings

---

## Head of Department (HOD)

The HOD owns all academic operations within their department.

Responsibilities include:

- Create Courses
- Update Courses
- Archive/Retire Courses
- Create Course Offerings
- Assign Lecturers
- Set Student Capacity
- Publish Course Offerings
- Manage Department Curriculum
- Register Students
- Approve Results
- View Department Analytics

The HOD may only manage courses belonging to their own department.

---

## Lecturer

Lecturers are responsible for teaching.

They may:

- View Assigned Courses
- Record Attendance
- Create Assessments
- Upload Scores
- Submit Results

Lecturers must **not**:

- Create Courses
- Modify Course Definitions
- Create Course Offerings
- Assign Lecturers

---

## Student

Students interact only with published Course Offerings.

Students may:

- View Available Course Offerings
- Register Courses
- View Timetable
- View Attendance
- View Results

Students cannot modify any course data.

---

# Distinguish Course from Course Offering

The system shall clearly separate these two concepts.

---

## Course

A Course represents the permanent academic definition.

Example attributes:

- Course Code
- Course Title
- Credit Units
- Description
- Programme
- Level
- Department
- Prerequisites (if implemented)
- Status (Active / Archived)

A Course exists independently of any semester.

---

## Course Offering

A Course Offering represents a Course being taught during a specific academic period.

Example attributes:

- Course Reference
- Academic Session
- Semester
- Assigned Lecturer
- Student Capacity
- Enrollment Count
- Status (Draft / Published / Closed)

A Course Offering is created every semester as required.

---

# Revised Course Lifecycle

## Step 1 — Create Course

Performed once.

```text
HOD
        ↓
Create Course
        ↓
Validate Course Code
        ↓
Validate Department
        ↓
Store Course
```

The Course becomes part of the department's curriculum.

---

## Step 2 — Create Course Offering

Performed each semester.

```text
HOD
        ↓
Select Existing Course
        ↓
Select Academic Session
        ↓
Select Semester
        ↓
Assign Lecturer
        ↓
Set Capacity
        ↓
Publish Offering
```

Creates a new Course Offering.

---

## Step 3 — Student Registration

```text
Student
        ↓
View Published Offerings
        ↓
Register Courses
        ↓
Enrollment Created
```

Students register against Course Offerings, **not** Courses.

---

## Step 4 — Lecturer Delivery

```text
Assigned Lecturer
        ↓
View Assigned Offering
        ↓
Take Attendance
        ↓
Create Assessments
        ↓
Upload Scores
        ↓
Submit Results
```

The lecturer interacts only with Course Offerings assigned to them.

---

# Course Management Interface

Move Course Management into the HOD Dashboard.

Required features:

- Create Course
- Edit Course
- Archive Course
- Search Courses
- Filter by Programme
- Filter by Level
- Filter by Status
- View Course Details

All pages must display live backend data.

---

# Course Offering Management Interface

Create a dedicated Course Offerings module within the HOD dashboard.

Features include:

- Create Offering
- Assign Lecturer
- Select Academic Session
- Select Semester
- Set Enrollment Capacity
- Publish Offering
- Close Offering
- View Enrollment Statistics

---

# Lecturer Assignment Workflow

The HOD assigns lecturers to Course Offerings.

```text
Select Course Offering
        ↓
View Department Lecturers
        ↓
Assign Lecturer
        ↓
Save Assignment
```

Validation:

- Lecturer must belong to the same department.
- Lecturer must have an active account.
- Prevent duplicate assignments where applicable.

---

# Department Authorization

Enforce department-level ownership.

A HOD:

May:

- Manage Courses within their department.
- Manage Course Offerings within their department.
- Assign lecturers within their department.

May not:

- Access Courses belonging to another department.
- Modify another department's curriculum.
- Assign lecturers from another department unless explicitly supported by business rules.

Unauthorized access must return an authorization error.

---

# Course Validation

Before creating a Course, validate:

- Course Code is unique within the department.
- Course Title is provided.
- Programme exists.
- Academic Level is valid.
- Credit Units are valid.
- Department matches the authenticated HOD.

---

# Course Offering Validation

Before publishing an Offering, validate:

- Course exists.
- Academic Session exists.
- Semester exists.
- Lecturer exists.
- Lecturer belongs to the department.
- Capacity is greater than zero.
- Duplicate offerings for the same course, semester, and session are prevented unless explicitly allowed.

---

# Database Responsibilities

The existing collections shall retain distinct responsibilities.

## courses

Stores permanent academic definitions.

Contains:

- Course Code
- Title
- Credits
- Department
- Programme
- Level
- Status

---

## courseofferings

Stores semester-specific offerings.

Contains:

- Course Reference
- Academic Session
- Semester
- Lecturer
- Capacity
- Enrollment Count
- Publication Status

Do not duplicate Course information inside Course Offerings beyond required references.

---

# Audit Logging

Generate audit log entries for:

- Course Created
- Course Updated
- Course Archived
- Course Offering Created
- Course Offering Published
- Lecturer Assigned

Each log entry should include:

- User
- Department
- Timestamp
- Action
- Entity Identifier

---

# Notifications

Generate notifications when:

- Lecturer is assigned to a Course Offering.
- Course Offering is published.
- Course Offering is updated.
- Course Offering is cancelled (if implemented).

Students should only be notified when relevant to published offerings.

---

# User Interface

Remove Course Management from the Administrator dashboard.

Add the following to the HOD dashboard:

- Course Management
- Course Offerings
- Lecturer Assignment
- Offering Status

Replace any placeholder pages with fully functional interfaces backed by live data.

---

# Automated Testing

Update the testing suite.

## Unit Tests

Verify:

- Course creation
- Course validation
- Course Offering creation
- Lecturer assignment
- Capacity validation
- Duplicate prevention

---

## Integration Tests

Verify:

- HOD creates Course
- HOD creates Course Offering
- Lecturer assignment
- Student registration against published offering
- Audit log creation
- Notification generation

---

## End-to-End Tests

Verify the complete workflow.

```text
HOD Login
        ↓
Create Course
        ↓
Create Course Offering
        ↓
Assign Lecturer
        ↓
Publish Offering
        ↓
Student Login
        ↓
Register Course
        ↓
Enrollment Created
        ↓
Lecturer Login
        ↓
Assigned Course Visible
        ↓
Attendance Recorded
        ↓
Assessment Created
        ↓
Results Submitted
```

Also verify:

- Unauthorized HOD access
- Cross-department course modification
- Duplicate Course Code
- Duplicate Course Offering
- Invalid lecturer assignment

---

# Documentation

Update:

- Course Management Architecture
- Course Offering Workflow
- Lecturer Assignment Workflow
- Authorization Model
- Testing Documentation

Remove all documentation stating that the Administrator manages Courses.

---

# Success Criteria

This revision is complete only when:

- Course management has been removed from the Administrator module.
- HODs fully manage Courses within their departments.
- HODs fully manage Course Offerings.
- Lecturer assignment is performed by HODs.
- Students register against published Course Offerings only.
- Department-level authorization is fully enforced.
- Audit logs are generated for all Course and Course Offering operations.
- Notifications are generated for lecturer assignments and published offerings.
- All Unit, Integration, and End-to-End tests pass successfully.
- The frontend fully supports the revised workflows with live backend integration.
```
