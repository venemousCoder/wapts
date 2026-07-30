# Web-Based Academic Progress Tracking System (WAPTS) - Implementation Plan

This document outlines the architecture, structure, schemas, and workflows for WAPTS, a platform designed to continuously track, analyze, and visualize student academic progress alongside standard academic record management.

## User Review Required
> [!IMPORTANT]
> Please review this comprehensive architecture and planning document. We need your explicit approval on the architecture, folder structure, schemas, route map, and workflows before we begin implementation and code generation.

## 1. Project Architecture
The application will follow a strict Modular MVC (Model-View-Controller) architecture enriched with a Service layer to encapsulate business logic.
- **Frontend**: EJS (Server-Side Rendering), Vanilla JS, HTML5, CSS3. Chart.js for analytics.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: Passport.js (Local Strategy), Express Sessions stored in MongoDB via `connect-mongodb-session`.
- **Flow**: Request -> Route -> Middleware (Auth/Role/Validation) -> Controller -> Service -> Model -> Database.

## 2. Folder Structure
```text
WAPTS/
├── config/             # DB connection, passport config, environment variables
├── controllers/        # Request handling and response formatting (grouped by entity/role)
├── middlewares/        # Auth, role checking, error handling, input validation
├── models/             # Mongoose schemas and models
├── routes/             # Express routes definition
├── services/           # Core business logic, academic progress engine, GPA calculations
├── utils/              # Helper functions, constants, logger
├── views/              # EJS templates
│   ├── admin/          # Admin specific views
│   ├── hod/            # HOD specific views
│   ├── lecturer/       # Lecturer specific views
│   ├── student/        # Student specific views
│   └── partials/       # Reusable components (navbar, sidebar, cards, modals)
├── public/             # Static files
│   ├── css/            # Vanilla CSS
│   ├── js/             # Vanilla JavaScript for interactivity, Chart.js integrations
│   └── images/         # Static images/assets
├── uploads/            # User-uploaded files (e.g., profile pictures, bulk uploads)
├── app.js              # Express app setup and middleware configuration
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## 3 & 6. Database Schema Diagram & Entity Relationships
```mermaid
erDiagram
    USER {
        ObjectId _id
        String username_or_email
        String password_hash
        String role "Enum: Admin, HOD, Lecturer, Student"
        Boolean is_active
    }
    DEPARTMENT {
        ObjectId _id
        String name
        String code
    }
    STUDENT {
        ObjectId _id
        ObjectId user_id
        String registration_number
        String first_name
        String last_name
        ObjectId department_id
        Number current_cgpa
    }
    LECTURER {
        ObjectId _id
        ObjectId user_id
        String institutional_email
        String first_name
        String last_name
        ObjectId department_id
        Boolean is_approved
    }
    HOD {
        ObjectId _id
        ObjectId user_id
        ObjectId department_id
        String first_name
        String last_name
    }
    ACADEMIC_SESSION {
        ObjectId _id
        String name "e.g., 2024/2025"
        Boolean is_active
    }
    SEMESTER {
        ObjectId _id
        String name "First, Second"
        ObjectId session_id
        Boolean is_active
    }
    COURSE {
        ObjectId _id
        String code
        String title
        Number credit_units
        ObjectId department_id
    }
    COURSE_OFFERING {
        ObjectId _id
        ObjectId course_id
        ObjectId session_id
        ObjectId semester_id
        ObjectId lecturer_id
    }
    ENROLLMENT {
        ObjectId _id
        ObjectId student_id
        ObjectId course_offering_id
        Date enrollment_date
    }
    ATTENDANCE {
        ObjectId _id
        ObjectId enrollment_id
        Date date
        Boolean is_present
    }
    ASSESSMENT {
        ObjectId _id
        ObjectId enrollment_id
        Number ca_score
        Number exam_score
    }
    RESULT {
        ObjectId _id
        ObjectId enrollment_id
        Number final_score
        String letter_grade
        Number grade_point
        Boolean is_pass
        Boolean is_submitted
    }
    NOTIFICATION {
        ObjectId _id
        ObjectId user_id
        String title
        String message
        Boolean is_read
        Date created_at
    }
    ACADEMIC_GOAL {
        ObjectId _id
        ObjectId student_id
        Number target_cgpa
        Date created_at
    }
    TRANSCRIPT {
        ObjectId _id
        ObjectId student_id
        String document_url
        Date generated_at
    }
    AUDIT_LOG {
        ObjectId _id
        ObjectId user_id
        String action
        String details
        Date timestamp
    }

    STUDENT ||--|| USER : is
    LECTURER ||--|| USER : is
    HOD ||--|| USER : is
    STUDENT }o--|| DEPARTMENT : belongs_to
    LECTURER }o--|| DEPARTMENT : belongs_to
    HOD ||--|| DEPARTMENT : heads
    COURSE }o--|| DEPARTMENT : belongs_to
    SEMESTER }o--|| ACADEMIC_SESSION : belongs_to
    COURSE_OFFERING }o--|| COURSE : offers
    COURSE_OFFERING }o--|| ACADEMIC_SESSION : in
    COURSE_OFFERING }o--|| SEMESTER : in
    COURSE_OFFERING }o--|| LECTURER : taught_by
    ENROLLMENT }o--|| STUDENT : enrolls
    ENROLLMENT }o--|| COURSE_OFFERING : in
    ATTENDANCE }o--|| ENROLLMENT : tracks
    ASSESSMENT ||--|| ENROLLMENT : evaluates
    RESULT ||--|| ENROLLMENT : summarizes
    NOTIFICATION }o--|| USER : notifies
    ACADEMIC_GOAL }o--|| STUDENT : sets
    TRANSCRIPT }o--|| STUDENT : belongs_to
    AUDIT_LOG }o--|| USER : logs
```

## 4. Route Map

| Prefix | Endpoint | Method | Role | Description |
|---|---|---|---|---|
| `/auth` | `/login` | GET/POST | All | User login |
| `/auth` | `/logout` | GET | All | User logout |
| `/admin` | `/dashboard` | GET | Admin | Admin analytics dashboard |
| `/admin` | `/departments` | GET/POST/PUT/DELETE | Admin | Manage departments |
| `/admin` | `/sessions` | GET/POST/PUT | Admin | Manage sessions & semesters |
| `/admin` | `/hods` | GET/POST/PUT | Admin | Manage HOD accounts |
| `/hod` | `/dashboard` | GET | HOD | HOD department analytics |
| `/hod` | `/lecturers` | GET/POST(Approve) | HOD | Manage/Approve lecturers |
| `/hod` | `/courses` | GET/POST/PUT | HOD | Manage department courses |
| `/hod` | `/allocations` | GET/POST | HOD | Assign lecturers to courses (Offerings) |
| `/hod` | `/students` | GET | HOD | Monitor student performance/warnings |
| `/lecturer` | `/dashboard` | GET | Lecturer | Lecturer analytics & assigned courses |
| `/lecturer` | `/courses/:id/attendance` | GET/POST | Lecturer | Record course attendance |
| `/lecturer` | `/courses/:id/assessments`| GET/POST | Lecturer | Upload CA/Exam scores |
| `/lecturer` | `/courses/:id/results` | GET/POST | Lecturer | Review/Submit final results |
| `/student` | `/dashboard` | GET | Student | Student analytics, GPA/CGPA trends |
| `/student` | `/courses` | GET | Student | View enrolled courses & attendance |
| `/student` | `/results` | GET | Student | View semester results |
| `/student` | `/goals` | GET/POST | Student | Set/View academic goals |
| `/student` | `/transcript` | GET | Student | View/Download transcript |
| `/api` | `/notifications` | GET/PUT | All | Fetch/Read notifications |

## 5. Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Client (Browser)
    participant Server (Express)
    participant Passport
    participant DB (MongoDB)

    User->>Client: Enters Credentials (ID/Email & Password)
    Client->>Server: POST /auth/login
    Server->>Passport: Authenticate Local Strategy
    Passport->>DB: Find User by ID/Email
    DB-->>Passport: Return User Record
    Passport->>Passport: Compare Password Hash
    alt Password Valid
        Passport->>Server: Attach user to req.user
        Server->>DB: Create Session (connect-mongodb-session)
        Server->>Client: Set Cookie & Redirect based on Role (e.g., /admin/dashboard)
    else Password Invalid
        Passport->>Server: Return Error
        Server->>Client: Redirect to /login with Flash Message
    end
```

## 7. System Workflow (Academic Cycle & Progress Engine)
```mermaid
flowchart TD
    A[Admin creates Academic Session & Semester] --> B[Admin creates Departments & HODs]
    B --> C[HOD creates Courses]
    C --> D[Lecturers Register & HOD Approves]
    D --> E[HOD creates Course Offerings & Assigns Lecturers]
    E --> F[Students Enrolled into Course Offerings]
    F --> G[Lecturer tracks Attendance over Semester]
    G --> H[Progress Engine detects low attendance -> Warns Student/HOD]
    F --> I[Lecturer inputs CA & Exam Scores]
    I --> J[System automatically computes Final Score, Grade, Grade Point]
    J --> K[Lecturer Submits Results]
    K --> L[Progress Engine Updates GPA & CGPA]
    L --> M[Progress Engine runs Trend Analysis]
    M --> N{Academic Risk Detected?}
    N -- Yes --> O[Generate Academic Warnings for Student/HOD]
    N -- No --> P[Update Academic Goal Progress]
    O --> Q[Dashboards & Analytics Updated]
    P --> Q
    Q --> R[Student views Transcripts, Analytics, Goals]
```

## Proposed Execution Plan
1. **Setup & Initialization**: Initialize Node.js project, install dependencies, set up modular folder structure.
2. **Database & Models**: Implement all Mongoose models with proper validation, timestamps, and indexes.
3. **Core Middlewares**: Setup Passport.js authentication, session management, and role-based authorization guards.
4. **Services (The Engines)**: Implement the GPA Engine, CGPA Engine, and the Academic Progress Engine (trend analysis, risk detection).
5. **Controllers & Routes**: Implement business logic handlers and connect them via Express routes.
6. **Frontend (EJS & Vanilla JS)**: Build responsive layouts using raw CSS, implement dashboards, partials, and Chart.js integration.
7. **Testing & Refinement**: Verify workflows and enforce role boundaries.
