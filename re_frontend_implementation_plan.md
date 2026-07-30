# Frontend Feature Completion & UI Integration

This plan details the process for Phase 3.5: completing the frontend by removing all placeholder UI elements, integrating them with the backend controllers, implementing functional forms/tables/modals, and ensuring a robust user experience across all four roles (Student, Lecturer, HOD, Admin). Following this, we will execute the required audits and generate the 10 deliverable reports.

## User Review Required

> [!IMPORTANT]
> This phase involves implementing a substantial amount of UI code (over 15 views) and backend controller glue logic to serve data to these views.
> Please review the module breakdown below. If there are any specific UI preferences (e.g. specific data table plugins, form handling methods like AJAX vs traditional POST) that you require, please mention them now. By default, I will use traditional HTML forms with Bootstrap styling, and fallback to fetch/AJAX where highly interactive modals require it, consistent with the existing application architecture.

## Open Questions

> [!WARNING]
> 1. Are there any specific external libraries you want to use for Data Tables (e.g., DataTables.net) or should I stick to native Bootstrap responsive tables?
> 2. For the 10 deliverables (Audit Reports, Completion Matrix, etc.), should they be consolidated into a single Markdown artifact or kept as separate Markdown files in a dedicated `/reports` directory?

## Proposed Changes

### Admin Module
Ensure the Administrator can fully manage the system entities.
#### [MODIFY] `routes/admin.js` & `controllers/adminController.js`
- Ensure data is fetched and passed to `users`, `departments`, `calendar`, `grades`, and `settings` views.
#### [MODIFY] `views/admin/users.ejs`
- Replace placeholder with a responsive table of users and a modal to create new users.
#### [MODIFY] `views/admin/departments.ejs`
- Replace placeholder with a responsive table of departments and a modal to add departments.
#### [MODIFY] `views/admin/calendar.ejs`, `grades.ejs`, `settings.ejs`
- Implement robust forms to manage the academic calendar, grade scales, and system settings respectively.

### Student Module
Ensure Students can register for courses, view attendance, and check results.
#### [MODIFY] `routes/student.js` & `controllers/studentController.js`
- Add new controller methods: `getCourses`, `getAttendance`, `getResults` to fetch the student's enrollments, attendance records, and graded results.
#### [MODIFY] `views/student/courses.ejs`
- Replace placeholder with a course registration interface showing available course offerings and an enrollment form.
#### [MODIFY] `views/student/attendance.ejs`
- Replace placeholder with a table showing attendance percentages and detailed session records.
#### [MODIFY] `views/student/results.ejs`
- Replace placeholder with a structured display of published semester results.

### Lecturer Module
Ensure Lecturers can manage their classes, record attendance, and input scores.
#### [MODIFY] `routes/lecturer.js` & `controllers/lecturerController.js`
- Add new controller methods: `getCourses`, `getAttendance`, `getAssessments`, `getResults` to fetch assigned courses, attendance sessions, active assessments, and submitted results.
#### [MODIFY] `views/lecturer/courses.ejs`
- Replace placeholder with a list of assigned courses and their student enrollments.
#### [MODIFY] `views/lecturer/attendance.ejs`
- Replace placeholder with an interface to select a course offering and mark student attendance.
#### [MODIFY] `views/lecturer/assessments.ejs`
- Replace placeholder with forms to create assessments and input scores for enrolled students.
#### [MODIFY] `views/lecturer/results.ejs`
- Replace placeholder with a workflow to compile assessments and submit final results to the HOD.

### Head of Department (HOD) Module
Ensure HODs can review submissions and view analytics.
#### [MODIFY] `routes/hod.js` & `controllers/hodController.js`
- Add new controller methods: `getReview`, `getAnalytics` to fetch pending results and department-wide metrics.
#### [MODIFY] `views/hod/review.ejs`
- Replace placeholder with an interface to review, approve, and publish submitted results.
#### [MODIFY] `views/hod/analytics.ejs`
- Replace placeholder with charts/tables visualizing department performance and attendance trends.

### Global Deliverables Generation
#### [NEW] `/reports/*`
- Automatically generate the 10 required markdown reports: Frontend Audit, Completion Matrix, Button Audit, Form Audit, Dashboard Integration, Table Integration, Modal Integration, Navigation Audit, Placeholder Removal, and Updated E2E Report.

## Verification Plan

### Automated Tests
- Run `npm run test` (Unit/Integration tests)
- Run `npm run test:e2e` (Playwright E2E tests) to ensure the newly implemented UI does not break existing functional assertions, and verify that the cross-browser suite remains stable.

### Manual Verification
- Start the server and manually verify the UI for completeness, loading states, responsiveness (Desktop/Mobile), and correct display of success/error flash messages.
