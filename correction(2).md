# WAPTS Architecture Amendment (Revision 2)


---

# 1. Authentication Model

The current User model stores multiple authentication identifiers:

- username
- institutionalEmail
- registrationNumber

This creates ambiguity during authentication.

Refactor the authentication model so that authentication uses a single configurable login identifier.

## User

Required fields

- loginIdentifier
- loginType
- passwordHash
- role
- firstName
- lastName
- middleName (optional)
- phoneNumber
- avatar
- gender
- accountStatus
- lastLogin
- createdAt
- updatedAt

Where

loginType ∈

- ADMIN_USERNAME
- INSTITUTIONAL_EMAIL
- REGISTRATION_NUMBER

The authentication service must authenticate using loginIdentifier and loginType rather than guessing between multiple fields.

---

# 2. Grade Scale Module

Letter grades and grade points must never be hardcoded.

Introduce a dedicated Grade Scale model.

## GradeScale

Fields

- minimumScore
- maximumScore
- letterGrade
- gradePoint
- description
- isActive

ResultService must obtain grading information from GradeScale instead of using conditional logic.

This allows institutions to modify grading policies without changing application code.

---

# 3. Curriculum Module

Courses alone are insufficient.

Students must only enroll in courses defined by their curriculum.

Create

Curriculum

Fields

- department
- level
- semester
- requiredCourses
- electiveCourses
- totalCredits

Enrollment validation must verify that selected courses belong to the student's curriculum.

---

# 4. Enrollment Lifecycle

Enrollment currently has no lifecycle.

Introduce

Enrollment Status

Possible states

- Enrolled
- Dropped
- Withdrawn
- Deferred
- Completed

Business rules must enforce valid state transitions.

Academic analytics must ignore withdrawn or dropped enrollments where appropriate.

---

# 5. Attendance Model Normalization

The current attendance model duplicates lecture session information.

Normalize attendance into two entities.

## AttendanceSession

Represents one lecture.

Fields

- courseOffering
- week
- lectureDate
- topic (optional)

## AttendanceRecord

Represents one student's attendance for one session.

Fields

- attendanceSession
- student
- present

Attendance percentage must be derived from AttendanceRecord.

---

# 6. Assessment Model Normalization

The Assessment model currently assumes only

- CA
- Exam

Replace this with a flexible assessment structure.

## AssessmentType

Examples

- Assignment
- Quiz
- Practical
- Laboratory
- Midterm
- Project
- Final Examination

## Assessment

Fields

- assessmentType
- courseOffering
- weight
- maximumScore
- dueDate

## StudentAssessment

Fields

- assessment
- student
- score

Final scores must be calculated using assessment weights rather than fixed CA/Exam fields.

This allows institutions to support different assessment structures.

---

# 7. Transcript Strategy

Transcripts should not be permanently stored as database records unless exported.

Instead

TranscriptService must generate transcripts dynamically from published academic records.

Only exported transcript files should be stored.

The Transcript collection becomes optional.

---

# 8. Service Refinement

Split responsibilities currently concentrated in ProgressService.

Introduce

GradeService

Responsibilities

- Grade conversion
- Grade lookup
- Grade scale management

CreditService

Responsibilities

- Credits earned
- Credits attempted
- Graduation credit progress

RiskService

Responsibilities

- Academic warning generation
- Risk detection
- Performance alerts

ReportService

Responsibilities

- Transcript generation
- Academic summaries
- Printable reports

ProgressService should orchestrate these services rather than implementing every calculation directly.

---

# 9. Scheduler Service

Some business processes should execute automatically.

Introduce SchedulerService.

Responsibilities

- Archive expired notifications
- Close expired academic sessions
- Activate scheduled sessions
- Backup application data (optional)
- Refresh dashboard snapshots
- Execute recurring maintenance tasks

Use node-cron.

---

# 10. Pagination and Filtering Standards

All list endpoints must support

- Pagination
- Search
- Sorting
- Filtering

This applies to

Students

Lecturers

Departments

Courses

Audit Logs

Notifications

Enrollments

Results

The implementation must not return large datasets without pagination.

---

# 11. Bulk Import Module

Lecturers should not manually enter hundreds of scores.

Introduce CSV import.

Workflow

Upload

↓

Validate

↓

Preview

↓

Confirm

↓

Import

Validation errors must be reported before database writes occur.

Supported imports

- Student Lists
- Course Enrollments
- Assessment Scores
- Final Results

---

# 12. Soft Delete Policy

The following entities must never be permanently deleted.

- Student
- Lecturer
- HOD
- Department
- Course
- Course Offering
- Curriculum

Implement

- isDeleted
- deletedAt

Queries should exclude deleted records by default.

---

# 13. Dashboard Snapshot Optimization

Dashboard calculations should not execute on every request.

Introduce DashboardSnapshot.

Whenever significant academic events occur

Attendance Recorded

Assessment Updated

Result Published

Enrollment Changed

Goal Updated

the Progress Engine must regenerate the affected dashboard snapshot.

Dashboard pages should primarily read from DashboardSnapshot rather than recalculating analytics.

---

# 14. Validation Standard

Use express-validator consistently across the application.

Validation rules must exist for every POST, PUT, and PATCH endpoint.

Validation belongs in dedicated middleware.

Controllers should never perform manual validation.

---

# 15. Academic Classification

The system must calculate expected graduation classification.

Examples

- First Class
- Second Class Upper
- Second Class Lower
- Third Class
- Pass

Classification rules must be configurable.

Student Dashboard should display

Current Classification

Expected Graduation Classification

Remaining CGPA required for next classification

This information must be generated by ProgressService.

---

# 16. Event Expansion

Extend the event-driven architecture.

Required business events

Student Enrolled

Student Withdrawn

Attendance Recorded

Assessment Created

Assessment Updated

Assessment Deleted

Result Draft Saved

Result Submitted

Result Approved

Result Published

Goal Updated

Academic Session Activated

Academic Session Closed

Configuration Updated

Each event must trigger only the services affected by that event.

Business logic should remain event-driven wherever practical.

---

# 17. Documentation Requirements

After incorporating these amendments, regenerate and update the following architectural artifacts so they remain internally consistent.

- Folder Structure
- Entity Relationship Diagram
- Database Schemas
- Service Contracts
- Route Map
- Permission Matrix
- State Machines
- Event Flow Diagrams
- Dashboard Specifications
- System Workflow

Only after all architecture documents have been synchronized should implementation begin.