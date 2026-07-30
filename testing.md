# Phase 5 — Software Testing

| Test Type           | Recommended Tool           |
| ------------------- | -------------------------- |
| Unit Testing        | Jest                       |
| Integration Testing | Jest + Supertest           |
| End-to-End Testing  | Playwright                 |
| Mocking             | Jest Mocks                 |
| Coverage            | Istanbul (built into Jest) |
| Test Database       | MongoDB Memory Server      |
| CI (optional)       | GitHub Actions             |


## Objective

The implementation has successfully completed the Verification & Validation phase.

The objective of this phase is to execute comprehensive software testing to verify that every component functions correctly both independently and as part of the complete system.

Testing shall focus on identifying defects rather than modifying the implementation.

Any defects discovered must be documented and deferred to the subsequent Refinement phase.

---

# Testing Principles

During this phase

- Execute tests rather than inspect code.
- Test expected behavior.
- Test unexpected behavior.
- Test edge cases.
- Test failure scenarios.
- Test security boundaries.
- Test system integration.
- Measure coverage.

No implementation changes are permitted during this phase.

---

# Testing Levels

The following testing levels shall be completed.

1. Unit Testing

2. Integration Testing

3. End-to-End Testing

4. Regression Testing

5. Security Testing

6. Performance Testing

7. Usability Testing

---

# Stage 1 — Unit Testing

Purpose

Verify individual functions, methods, services, middleware, validators and utilities in isolation.

Recommended Framework

- Jest

Test

Controllers

Services

Utilities

Validators

Middleware

Event Handlers

Permission Checks

Business Calculations

Examples

Authentication

- Password hashing
- Login validation
- Session creation

GradeService

- Letter grade calculation
- Grade point lookup

CreditService

- Credit calculation

ProgressService

- GPA calculation
- CGPA calculation
- Classification calculation

RiskService

- Academic warning detection

AttendanceService

- Attendance percentage

GoalService

- Goal progress calculation

Every public service method should have corresponding unit tests.

Target Coverage

- Statements ≥ 90%
- Functions ≥ 90%
- Branches ≥ 80%
- Lines ≥ 90%

Deliverables

- Unit Test Report
- Coverage Report

---

# Stage 2 — Integration Testing

Purpose

Verify communication between modules.

Recommended Framework

- Jest
- Supertest

Test

Authentication → Dashboard

Enrollment → Curriculum Validation

Attendance → Progress Engine

Assessment → Result Calculation

Result Publication → Dashboard Snapshot

Result Publication → Notification

Result Publication → Transcript

Academic Calendar → Enrollment

Scheduler → Notifications

StorageService → Upload Provider

Verify

- Data flow
- Transactions
- Event chains
- Database updates

Deliverables

- Integration Test Report

---

# Stage 3 — End-to-End Testing

Purpose

Simulate real user workflows.

Recommended Framework

- Playwright

Test all supported roles

Student

Lecturer

HOD

Administrator

---

## Student Scenarios

Login

↓

Dashboard

↓

View Courses

↓

View Attendance

↓

View Results

↓

View Transcript

↓

Update Goal

↓

Logout

---

## Lecturer Scenarios

Login

↓

View Assigned Courses

↓

Take Attendance

↓

Create Assessment

↓

Upload Scores

↓

Submit Results

↓

Logout

---

## HOD Scenarios

Login

↓

Review Submitted Results

↓

Approve Results

↓

View Department Analytics

↓

Logout

---

## Administrator Scenarios

Login

↓

Manage Users

↓

Manage Departments

↓

Manage Academic Calendar

↓

Manage Grade Scale

↓

Manage Configuration

↓

Logout

Deliverables

- End-to-End Test Report

---

# Stage 4 — Regression Testing

Purpose

Ensure completed functionality continues to operate correctly.

Re-run

- Authentication
- Enrollment
- Attendance
- Results
- Dashboards
- Notifications
- Transcript
- Scheduler

Regression tests should execute automatically after implementation changes.

---

# Stage 5 — Security Testing

Verify

Authentication

Authorization

Session Security

Password Hashing

Input Validation

Rate Limiting

CSRF Protection

XSS Protection

File Upload Validation

Access Control

Privilege Escalation

Session Expiration

Direct URL Access

Test both authorized and unauthorized scenarios.

Deliverables

- Security Test Report

---

# Stage 6 — Performance Testing

Measure

Login Response

Dashboard Load

Transcript Generation

CSV Import

Bulk Result Publication

Pagination

Notification Generation

Dashboard Snapshot Update

Memory Usage

Database Query Count

Measure

Average Response Time

95th Percentile

Maximum Response Time

Document bottlenecks.

Deliverables

- Performance Test Report

---

# Stage 7 — Usability Testing

Verify

Navigation

Consistency

Responsive Layout

Accessibility

Error Messages

Loading States

Empty States

Form Validation

Role-specific Workflows

Evaluate

Student Experience

Lecturer Experience

HOD Experience

Administrator Experience

Deliverables

- Usability Test Report

---

# Test Case Standards

Every test case shall include

- Test ID
- Requirement ID
- Feature
- Description
- Preconditions
- Test Steps
- Expected Result
- Actual Result
- Status

Status values

- PASS
- FAIL
- BLOCKED
- SKIPPED

Example

Test ID

TC-AUTH-001

Requirement

REQ-AUTH-001

Description

Student logs in with valid credentials.

Expected

Dashboard displayed.

Actual

Dashboard displayed.

Status

PASS

---

# Coverage Metrics

Generate

- Unit Test Coverage
- Integration Coverage
- End-to-End Coverage
- Requirement Coverage

Coverage should include

- Statements
- Branches
- Functions
- Lines

---

# Defect Tracking

Every failed test shall generate a defect record.

Each defect must include

- Defect ID
- Severity
- Priority
- Module
- Description
- Steps to Reproduce
- Expected Result
- Actual Result
- Suggested Resolution

Severity

- Critical
- High
- Medium
- Low

---

# Final Testing Report

Produce

1. Unit Test Report
2. Integration Test Report
3. End-to-End Test Report
4. Regression Test Report
5. Security Test Report
6. Performance Test Report
7. Usability Test Report
8. Coverage Report
9. Defect Report
10. Overall Testing Summary

The Overall Testing Summary shall include

- Total Test Cases
- Passed
- Failed
- Blocked
- Skipped
- Overall Pass Rate
- Coverage Metrics
- Outstanding Defects
- Release Recommendation

Release Recommendation

- Ready for Refinement
- Ready for Production
- Production Blocked

---

# Constraints

During this phase

DO NOT

- Refactor implementation
- Add features
- Change architecture
- Modify business rules

ONLY

- Execute tests
- Measure coverage
- Document defects
- Produce reports

Implementation changes belong exclusively to the Refinement phase.

---

# Exit Criteria

Testing is complete only when

- All planned tests have been executed.
- Coverage reports have been generated.
- Defects have been documented.
- Overall testing reports have been produced.
- A release recommendation has been issued.

Only after testing is complete may the project proceed to **Phase 6 — Refinement & Bug Fixing**.