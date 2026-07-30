# WAPTS Architecture Revision Directive

The current implementation plan is approved as the foundation of the project.

However, before implementation begins, revise the architecture according to the following requirements.

These changes are mandatory.

---

# 1. User Model Refactoring

The current architecture duplicates identity information across the User, Student, Lecturer, and HOD models.

This must be corrected.

## User Model

The User model becomes the single source of truth for authentication and identity.

Fields include:

- username (Admin only)
- institutionalEmail (Lecturer/HOD)
- registrationNumber (Student)
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

Authentication data and personal identity must never be duplicated elsewhere.

---

## Student Profile

Contains only student-specific information.

Example

- userId
- department
- level
- admissionYear
- admissionType
- currentCGPA
- totalCreditsEarned
- totalCreditsAttempted
- graduationStatus

---

## Lecturer Profile

Contains only lecturer-specific information.

Example

- userId
- department
- designation
- specialization
- approvalStatus

---

## HOD Profile

Contains only HOD-specific information.

Example

- userId
- department
- appointmentDate

---

# 2. Result Approval Workflow

Results must never become immediately visible after lecturer submission.

Implement the following workflow.

Draft

↓

Submitted

↓

Approved

↓

Published

↓

Archived

Rules

- Lecturer edits Draft.
- Lecturer submits.
- HOD reviews.
- HOD approves.
- System publishes.
- Students only see Published results.

Only Published results participate in GPA and CGPA calculations.

---

# 3. Academic Progress Engine Contract

The Progress Engine must become a dedicated service.

It must expose reusable methods.

Required methods

calculateSemesterGPA()

calculateCGPA()

calculateCreditCompletion()

calculateGraduationProgress()

calculateAttendancePercentage()

calculateAttendanceTrend()

calculateSemesterTrend()

detectPerformanceImprovement()

detectPerformanceDecline()

detectWeakCourses()

detectStrongCourses()

detectAcademicRisk()

calculateGoalProjection()

generateAcademicSummary()

generateDashboardMetrics()

All dashboards must consume this service.

Business logic must never be duplicated elsewhere.

---

# 4. Service Layer Contracts

Every service must have a clearly defined responsibility.

Required services

AuthService

UserService

DepartmentService

SessionService

SemesterService

CourseService

CourseOfferingService

EnrollmentService

AttendanceService

AssessmentService

ResultService

TranscriptService

NotificationService

ProgressService

AnalyticsService

GoalService

AuditService

Services communicate with models.

Controllers communicate only with services.

Routes communicate only with controllers.

---

# 5. Entity State Machines

Every mutable entity must have lifecycle states.

---

## Lecturer

Pending

↓

Approved

↓

Active

↓

Suspended

↓

Archived

---

## Result

Draft

↓

Submitted

↓

Approved

↓

Published

↓

Archived

---

## Course Offering

Scheduled

↓

Active

↓

Completed

↓

Archived

---

## Notification

Unread

↓

Read

↓

Archived

---

## Academic Session

Upcoming

↓

Active

↓

Closed

↓

Archived

---

These state transitions must be enforced by business rules.

---

# 6. System Configuration Module

Remove all hardcoded academic rules.

Create a configurable System Settings collection.

Configuration includes

Attendance Threshold

Minimum Passing Score

CA Weight

Exam Weight

Minimum GPA

Maximum Credit Load

Minimum Credit Load

Current Academic Session

Current Semester

Maximum Login Attempts

Session Timeout

Only Admin may edit configuration.

Every service must read values from configuration.

---

# 7. Permission Matrix

Replace textual role descriptions with a permission matrix.

Each operation must explicitly define

Create

Read

Update

Delete

Approve

Publish

Export

Print

View Analytics

Manage Users

Manage Departments

Manage Sessions

Manage Courses

Manage Results

Manage Attendance

Manage Notifications

The authorization middleware must rely on this matrix.

---

# 8. Dashboard Specifications

Each dashboard must define reusable widgets.

---

## Student Dashboard

Current GPA Card

Current CGPA Card

Credits Earned Card

Credits Remaining Card

Attendance Card

Goal Progress Card

Academic Warning Card

Semester Trend Chart

Attendance Trend Chart

Weak Courses Table

Strong Courses Table

Notifications Panel

Upcoming Deadlines

---

## Lecturer Dashboard

Assigned Courses

Pending Submissions

Average Score

Pass Rate

Fail Rate

Attendance Statistics

Grade Distribution

Student Risk Summary

Notifications

---

## HOD Dashboard

Department Statistics

Department GPA

Department Pass Rate

Students At Risk

Lecturer Workload

Course Performance

Enrollment Statistics

Pending Result Approvals

Notifications

---

## Admin Dashboard

Departments

Students

Lecturers

Active Sessions

System Usage

Storage Statistics

Recent Activity

Audit Logs

---

# 9. Event-Driven Business Rules

The system must define events.

Example

Attendance Recorded

↓

Attendance Percentage Updated

↓

Risk Detection Executed

↓

Dashboard Updated

↓

Notification Generated

---

Result Published

↓

Semester GPA Recalculated

↓

CGPA Recalculated

↓

Progress Engine Executed

↓

Goal Tracker Updated

↓

Risk Detection Executed

↓

Analytics Updated

↓

Notifications Generated

Business events should trigger downstream services automatically.

---

# 10. API Standards

All endpoints must follow consistent conventions.

Controllers return standardized responses.

Response types

Success

Validation Error

Authentication Error

Authorization Error

Resource Not Found

Conflict

Server Error

Every POST/PUT/PATCH endpoint requires validation middleware.

---

# 11. Non-Functional Requirements

Implement

Helmet

Compression

Rate Limiting

CSRF Protection

Session Management

Secure Cookies

Password Hashing (bcrypt)

Morgan Logging

Central Error Handler

Input Validation

Environment Variables

No credentials may exist in source code.

---

# 12. Seed Data

Generate development seeders.

Seed

1 Admin

3 Departments

3 HODs

15 Lecturers

200 Students

40 Courses

2 Academic Sessions

Course Offerings

Enrollments

Attendance

Assessments

Results

Notifications

Academic Goals

The application should be usable immediately after seeding.

---

# 13. Repository Structure Standards

Every major feature must include

Model

Service

Controller

Routes

Validation

Views

Client JavaScript

CSS

Tests (optional)

No feature should partially implement this structure.

---

# 14. File Upload Strategy

Use Multer.

Abstract storage implementation.

Development

Local Storage

Production

Cloudinary-compatible provider

Validate

MIME type

Maximum file size

Allowed extensions

Supported uploads

Profile Pictures

Bulk Result Uploads (CSV)

Transcript Exports

---

# 15. Error Handling Strategy

Create centralized error handling.

Handle

Validation Errors

Authentication Errors

Authorization Errors

404 Errors

Duplicate Key Errors

Database Errors

Session Expiration

Unexpected Exceptions

Every error should render an appropriate page or JSON response depending on request type.

---

# 16. Audit Logging

Every sensitive action must generate an audit log.

Examples

Login

Logout

Create User

Approve Lecturer

Assign Lecturer

Submit Result

Approve Result

Publish Result

Change Configuration

Delete Course

Each log records

- User
- Action
- Timestamp
- IP Address
- Resource
- Before State (optional)
- After State (optional)

---

# 17. Implementation Constraint

Do not begin implementation until this revised architecture has been incorporated.

After revision, regenerate:

1. Folder Structure
2. Entity Relationship Diagram
3. Database Schemas
4. Route Map
5. Service Contracts
6. Permission Matrix
7. State Machines
8. Event Flow Diagrams
9. Dashboard Specifications
10. System Workflow

Only after these artifacts are internally consistent should implementation begin.