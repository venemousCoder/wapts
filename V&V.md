# Phase 4 — Verification & Validation (V&V)

## Objective

Implementation is complete.

This phase exists to verify that the implementation conforms to the approved architecture, satisfies all functional and non-functional requirements, correctly enforces business rules, and is ready for refinement.

This phase is **verification only**.

No implementation changes, refactoring, feature additions, or architectural modifications are permitted during this phase.

If issues are discovered, they must be documented for resolution during the Refinement phase.

---

# Validation Principles

During this phase:

- Verify, do not modify.
- Compare implementation against the finalized architecture.
- Validate every requirement individually.
- Never assume correctness.
- Every conclusion must be supported by evidence.
- Record every discrepancy regardless of severity.
- Produce objective reports rather than subjective summaries.

---

# Validation Workflow

The validation process shall follow the stages below in order.

---

# Stage 1 — Architecture Conformance Validation

Purpose

Verify that the implemented codebase follows the approved architecture.

Validate

- Folder structure
- MVC separation
- Service boundaries
- Controller responsibilities
- Middleware placement
- Route organization
- Event-driven architecture
- ProgressService orchestration
- Storage abstraction
- Scheduler implementation
- DashboardSnapshot implementation
- Configuration management
- Layer separation

For each item report

- Expected Architecture
- Actual Implementation
- Evidence
- Status

Deliverable

Architecture Conformance Report

---

# Stage 2 — Functional Validation

Purpose

Verify every functional module.

Modules include

- Authentication
- User Management
- Department Management
- Academic Calendar
- Curriculum
- Course Management
- Course Offering
- Enrollment
- Attendance
- Assessment
- Grade Scale
- Results
- Progress Engine
- Risk Detection
- Goal Tracking
- Dashboard
- Notifications
- Transcript
- CSV Import
- Scheduler
- Audit Logging

For every module validate

- Features implemented
- Missing functionality
- Edge cases
- Expected behavior
- Actual behavior
- Evidence
- Status

Deliverable

Functional Validation Report

---

# Stage 3 — Business Rule Validation

Purpose

Verify every business rule.

Examples

Authentication

- Only valid accounts can log in.
- Suspended accounts cannot authenticate.

Authorization

- Students access only their own records.
- Lecturers manage only assigned courses.
- HOD approves results.
- Admin manages configuration only.

Academic Rules

- Enrollment follows curriculum.
- Enrollment respects Academic Calendar.
- Grade Scale determines letter grades.
- GPA is automatically calculated.
- CGPA is automatically calculated.
- Classification is automatically calculated.
- Attendance warnings are generated.
- Risk detection functions correctly.

Workflow Rules

- Draft → Submitted → Approved → Published → Archived
- Dashboard updates after academic events.
- Notifications generated after required events.

Each rule must contain

- Requirement
- Expected Result
- Actual Result
- Evidence
- Status

Deliverable

Business Rule Validation Report

---

# Stage 4 — Integration Validation

Purpose

Verify interactions between modules.

Validate event chains.

Examples

Attendance Recorded

↓

AttendanceService

↓

ProgressService

↓

DashboardSnapshot

↓

NotificationService

Result Published

↓

GradeService

↓

CreditService

↓

ProgressService

↓

RiskService

↓

DashboardSnapshot

↓

NotificationService

Enrollment Created

↓

EnrollmentService

↓

CreditService

↓

ProgressService

↓

DashboardSnapshot

Verify every downstream dependency.

Deliverable

Integration Validation Report

---

# Stage 5 — Data Integrity Validation

Purpose

Verify database consistency.

Validate

- No orphan references
- No duplicate enrollments
- GradeScale consistency
- Classification consistency
- Curriculum consistency
- Attendance consistency
- Assessment weight totals
- GPA accuracy
- Transcript accuracy
- DashboardSnapshot accuracy
- Soft delete enforcement
- Transaction integrity
- Rollback behavior

Deliverable

Data Integrity Validation Report

---

# Stage 6 — Security Validation

Purpose

Verify application security.

Validate

Authentication

Authorization

Session Management

Password Hashing

Role Enforcement

Rate Limiting

Helmet

CSRF Protection

Input Validation

Output Escaping

Secure Cookies

Environment Variables

Audit Logging

File Upload Validation

Storage Permissions

Soft Delete Protection

Deliverable

Security Validation Report

---

# Stage 7 — Performance Validation

Purpose

Measure application performance.

Evaluate

- Authentication response time
- Dashboard loading
- Transcript generation
- CSV import
- Bulk result publishing
- Pagination
- Database query efficiency
- Memory usage
- Dashboard snapshot generation
- Event processing

Highlight bottlenecks.

Deliverable

Performance Validation Report

---

# Stage 8 — User Experience Validation

Purpose

Verify that workflows are intuitive and complete.

Validate

Student

- Login
- Dashboard
- Enrollment
- Transcript
- Notifications
- Goal Tracking

Lecturer

- Attendance
- Assessment
- Result Submission
- Dashboard

HOD

- Result Approval
- Course Allocation
- Analytics

Admin

- Configuration
- Departments
- Grade Scales
- Academic Calendar
- User Management

Evaluate

- Navigation
- Form validation
- Error messages
- Responsiveness
- Accessibility
- Consistency

Deliverable

User Experience Validation Report

---

# Stage 9 — Documentation Validation

Purpose

Verify that implementation documentation matches the codebase.

Validate

- Folder structure
- ER Diagram
- Database schemas
- Route map
- Service contracts
- Permission matrix
- State machines
- Event flows
- Dashboard specifications
- Deployment documentation

Deliverable

Documentation Validation Report

---

# Final Validation Summary

Produce a consolidated report.

For every validation item include

- Requirement
- Expected Behavior
- Actual Behavior
- Evidence
- Status

Status values

- PASS
- FAIL
- WARNING
- NOT IMPLEMENTED

Calculate

- Total Requirements
- Passed
- Failed
- Warnings
- Coverage Percentage

---

# Issue Classification

All identified issues must be categorized.

## Critical

Issues preventing correct operation or risking data integrity.

Examples

- Broken authentication
- Incorrect GPA calculation
- Transaction failures
- Authorization bypass

---

## High

Major functional defects.

Examples

- Incorrect dashboard analytics
- Event failures
- Transcript inconsistencies

---

## Medium

Non-critical functional or UI issues.

Examples

- Pagination issues
- Notification problems
- Minor workflow inconsistencies

---

## Low

Cosmetic or minor improvements.

Examples

- UI alignment
- Wording
- Minor responsiveness issues

---

# Validation Evidence Requirements

Every conclusion must include objective evidence.

Acceptable evidence includes

- Controller
- Service
- Middleware
- Model
- Route
- View
- Validation middleware
- Event handler
- Scheduler
- Test output
- Log output

Statements such as

"Works correctly"

without supporting evidence are not acceptable.

---

# Constraints

During this phase

DO NOT

- Add features
- Refactor code
- Change architecture
- Rename modules
- Introduce new services
- Modify business rules

ONLY

- Verify
- Validate
- Measure
- Document
- Report

---

# Exit Criteria

The Verification & Validation phase is complete only when

- All validation reports have been generated.
- Every implemented requirement has been evaluated.
- Every issue has been classified by severity.
- Coverage metrics have been calculated.
- A final Validation Summary has been produced.

Only after formal review and approval of the Validation Summary may the project proceed to **Phase 5 — Refinement**.