# Web-Based Academic Progress Tracking System (WAPTS) - Final Architecture Plan

This document outlines the final, amended architecture for WAPTS, incorporating all architectural corrections including centralized user management, normalized attendance and assessments, dynamic transcript generation, optimized dashboards, soft delete policies, and a comprehensive event-driven workflow.

## User Review Required
> [!IMPORTANT]
> Please review this final architecture plan. We need your explicit approval on the updated folder structure, entity relationships, database schemas, route map, service contracts, permission matrix, state machines, event flows, dashboard specs, and system workflow before beginning implementation.

## 1. Folder Structure
```text
WAPTS/
├── config/             # DB, passport, env, system config defaults
├── controllers/        # Request handling, response formatting
├── middlewares/        # Auth, Permissions, express-validator, error handler, rate limit
├── models/             # Mongoose schemas (User, Curriculum, DashboardSnapshot, etc.)
├── routes/             # Express routes definition
├── services/           # Core business logic (Auth, Progress, Risk, Grade, etc.)
├── seeders/            # Seed data scripts
├── utils/              # Helper functions, logger, API response formatter, CSV parser
├── views/              # EJS templates (Admin, HOD, Lecturer, Student, layouts)
├── public/             # Static CSS, JS (Chart.js), images
├── uploads/            # Multer local storage (Profiles, CSV bulk imports, Transcripts)
├── app.js              # Express app setup
└── server.js           # Server entry point
```

## 2 & 3. Entity Relationship Diagram & Database Schemas
```mermaid
erDiagram
    USER {
        ObjectId _id
        String loginIdentifier
        String loginType "ADMIN_USERNAME, INSTITUTIONAL_EMAIL, REG_NUMBER"
        String passwordHash
        String role "Admin, HOD, Lecturer, Student"
        String firstName
        String lastName
        String middleName
        String phoneNumber
        String avatar
        String gender
        String accountStatus
        Date lastLogin
        Boolean isDeleted
        Date deletedAt
    }
    STUDENT_PROFILE {
        ObjectId _id
        ObjectId userId
        ObjectId departmentId
        Number level
        Number admissionYear
        String admissionType
        Number currentCGPA
        Number totalCreditsEarned
        Number totalCreditsAttempted
        String graduationStatus
        Boolean isDeleted
        Date deletedAt
    }
    LECTURER_PROFILE {
        ObjectId _id
        ObjectId userId
        ObjectId departmentId
        String designation
        String specialization
        String approvalStatus
        Boolean isDeleted
        Date deletedAt
    }
    HOD_PROFILE {
        ObjectId _id
        ObjectId userId
        ObjectId departmentId
        Date appointmentDate
        Boolean isDeleted
        Date deletedAt
    }
    SYSTEM_SETTING {
        ObjectId _id
        Number attendanceThreshold
        Number minCreditLoad
        Number maxCreditLoad
        ObjectId currentAcademicSession
        ObjectId currentSemester
    }
    GRADE_SCALE {
        ObjectId _id
        Number minimumScore
        Number maximumScore
        String letterGrade
        Number gradePoint
        String description
        Boolean isActive
    }
    CURRICULUM {
        ObjectId _id
        ObjectId departmentId
        Number level
        ObjectId semesterId
        ObjectId[] requiredCourses
        ObjectId[] electiveCourses
        Number totalCredits
        Boolean isDeleted
        Date deletedAt
    }
    DEPARTMENT {
        ObjectId _id
        String name
        String code
        Boolean isDeleted
        Date deletedAt
    }
    COURSE {
        ObjectId _id
        String code
        String title
        Number creditUnits
        ObjectId departmentId
        Boolean isDeleted
        Date deletedAt
    }
    COURSE_OFFERING {
        ObjectId _id
        ObjectId courseId
        ObjectId sessionId
        ObjectId semesterId
        ObjectId lecturerId
        String status
        Boolean isDeleted
        Date deletedAt
    }
    ENROLLMENT {
        ObjectId _id
        ObjectId studentId
        ObjectId courseOfferingId
        Date enrollmentDate
        String status "Enrolled, Dropped, Withdrawn, Deferred, Completed"
    }
    ATTENDANCE_SESSION {
        ObjectId _id
        ObjectId courseOfferingId
        Number week
        Date lectureDate
        String topic
    }
    ATTENDANCE_RECORD {
        ObjectId _id
        ObjectId attendanceSessionId
        ObjectId studentId
        Boolean isPresent
    }
    ASSESSMENT {
        ObjectId _id
        String assessmentType "Assignment, Quiz, Midterm, Final, etc."
        ObjectId courseOfferingId
        Number weight
        Number maximumScore
        Date dueDate
    }
    STUDENT_ASSESSMENT {
        ObjectId _id
        ObjectId assessmentId
        ObjectId studentId
        Number score
    }
    RESULT {
        ObjectId _id
        ObjectId enrollmentId
        Number finalScore
        String letterGrade
        Number gradePoint
        Boolean isPass
        String status "Draft, Submitted, Approved, Published, Archived"
    }
    DASHBOARD_SNAPSHOT {
        ObjectId _id
        ObjectId userId
        String role
        Object metrics "JSON payload of calculated metrics"
        Date updatedAt
    }

    USER ||--o| STUDENT_PROFILE : has
    USER ||--o| LECTURER_PROFILE : has
    USER ||--o| HOD_PROFILE : has
    DEPARTMENT ||--o{ STUDENT_PROFILE : has
    DEPARTMENT ||--o{ LECTURER_PROFILE : has
    DEPARTMENT ||--o| HOD_PROFILE : heads
    CURRICULUM ||--o{ COURSE : includes
    DEPARTMENT ||--o{ CURRICULUM : offers
    COURSE ||--o{ COURSE_OFFERING : offered_as
    STUDENT_PROFILE ||--o{ ENROLLMENT : enrolls_in
    COURSE_OFFERING ||--o{ ENROLLMENT : has
    COURSE_OFFERING ||--o{ ATTENDANCE_SESSION : has
    ATTENDANCE_SESSION ||--o{ ATTENDANCE_RECORD : records
    COURSE_OFFERING ||--o{ ASSESSMENT : defines
    ASSESSMENT ||--o{ STUDENT_ASSESSMENT : graded
    ENROLLMENT ||--o| RESULT : produces
```

## 4. Route Map (Standardized with Pagination & Validation)

| Prefix | Endpoint | Method | Role | Description |
|---|---|---|---|---|
| `/auth` | `/login`, `/logout` | GET/POST | All | Uses `loginIdentifier` & `loginType` |
| `/admin` | `/dashboard` | GET | Admin | Reads from DashboardSnapshot |
| `/admin` | `/settings`, `/grade-scales` | GET/PUT | Admin | System and Grade configurations |
| `/admin` | `/departments`, `/curriculums` | GET/POST/PUT | Admin | Manage departments & curriculums |
| `/admin` | `/users` | GET/POST/PUT/DEL| Admin | Soft delete enforced. |
| `/hod` | `/dashboard` | GET | HOD | Reads from DashboardSnapshot |
| `/hod` | `/allocations` | GET/POST | HOD | Manage Course Offerings |
| `/hod` | `/results/approve` | GET/POST | HOD | Review/Approve results |
| `/lecturer` | `/dashboard` | GET | Lecturer| Reads from DashboardSnapshot |
| `/lecturer` | `/courses/:id/attendance`| GET/POST | Lecturer| Manage Attendance Sessions & Records |
| `/lecturer` | `/courses/:id/assessments`| GET/POST | Lecturer| Define Assessments & Upload Scores |
| `/student` | `/dashboard` | GET | Student | DashboardSnapshot + Classifications |
| `/student` | `/courses` | GET/POST | Student | Enroll in Curriculum courses |
| `/student` | `/transcript` | GET | Student | Dynamic generation |
| `/import` | `/csv` | POST | Adm/HOD/Lec | Bulk upload (Validate->Preview->Confirm->Import) |

## 5. Service Contracts

- **AuthService**: Handles `loginIdentifier` & `loginType`.
- **GradeService**: Grade conversion, lookup based on `GradeScale` model.
- **CreditService**: Calculates earned/attempted credits and graduation credit progress.
- **RiskService**: Detects academic risks, generates warnings and alerts.
- **ReportService**: Dynamically generates transcripts and academic summaries.
- **ProgressService (Orchestrator)**: Orchestrates Grade, Credit, Risk, and Report services. Re-generates `DashboardSnapshot`.
- **EnrollmentService**: Validates enrollments against Curriculum.
- **AttendanceService**: Manages Sessions and Records.
- **AssessmentService**: Manages flexible assessment types and calculations.
- **ResultService**: Draft/Submit/Approve/Publish states. Calculates final scores using `Assessment` weights.
- **SchedulerService (node-cron)**: Archives expired items, refreshes dashboards, session rollovers.
- **ImportService**: Orchestrates CSV Upload -> Validate -> Preview -> Confirm -> Import workflow.

## 6. Permission Matrix
| Operation | Admin | HOD | Lecturer | Student |
|---|:---:|:---:|:---:|:---:|
| **Manage System Config & Grades** | ✔ | ✘ | ✘ | ✘ |
| **Manage Curriculums & Depts** | ✔ | ✘ | ✘ | ✘ |
| **Approve Lecturers & Allocations**| ✘ | ✔ | ✘ | ✘ |
| **Approve/Publish Results** | ✘ | ✔ | ✘ | ✘ |
| **Manage Assessments & Attendance**| ✘ | ✘ | ✔ | ✘ |
| **Enroll in Courses** | ✘ | ✘ | ✘ | ✔ |
| **View Own Transcripts/Results** | ✘ | ✘ | ✘ | ✔ |
| **Bulk Import Data** | ✔ | ✔ | ✔(Scores)| ✘ |

## 7. State Machines
- **Enrollment**: `Enrolled` -> `Dropped` | `Withdrawn` | `Deferred` | `Completed`
- **Result**: `Draft` -> `Submitted` -> `Approved` -> `Published` -> `Archived`
- **Course Offering**: `Scheduled` -> `Active` -> `Completed` -> `Archived`
- **Lecturer**: `Pending` -> `Approved` -> `Active` -> `Suspended` -> `Archived`

## 8. Event Flow Diagrams
```mermaid
flowchart TD
    subgraph Assessment & Result Event Flow
        E1[Assessment Updated / Result Published] --> E2[ProgressService Orchestrator]
        E2 --> E3[GradeService Re-calculates Scores]
        E2 --> E4[CreditService Updates Credits]
        E2 --> E5[RiskService Evaluates Alerts]
        E3 & E4 & E5 --> E6[ProgressService Re-generates DashboardSnapshot]
        E6 --> E7[Notifications Generated]
    end
```

## 9. Dashboard Specifications (Snapshot Driven)
Calculated offline/asynchronously on events. Displayed on read:
- **Student Dashboard**: Current/Expected Classification, Remaining CGPA to next class, Attendance %, Credits info.
- **Lecturer Dashboard**: Pending Submissions, Pass/Fail Rates, Assessment Distributions.
- **HOD Dashboard**: Dept GPA, Students At Risk, Pending Result Approvals.
- **Admin Dashboard**: System metrics, Storage Stats, Audit Logs.

## 10. System Workflow
```mermaid
sequenceDiagram
    participant Admin
    participant HOD
    participant Lecturer
    participant EventBus
    participant Orchestrator (ProgressService)
    participant Student
    
    Admin->>System: Sets Config, Curriculums, Grade Scales
    HOD->>System: Schedules Offerings from Curriculum
    Student->>System: Enrolls (Validated vs Curriculum)
    Lecturer->>System: Defines Assessments & Sessions
    Lecturer->>System: Bulk Imports Scores (Validate -> Preview -> Import)
    Lecturer->>System: Submits Results -> HOD Publishes
    System->>EventBus: Emit "Result Published"
    EventBus->>Orchestrator: Trigger Academic Updates
    Orchestrator->>System: Update Grade/Credit/Risk Services
    Orchestrator->>System: Regenerate DashboardSnapshot
    Student->>System: Views Snapshot Dashboard & Dynamic Transcript
```
