# Phase 6 — End-to-End (E2E) Testing

## Objective

All unit, integration, validation, and defect resolution activities have completed successfully.

The objective of this phase is to verify that complete user workflows operate correctly from the perspective of real users interacting with the application through the browser.

Testing must simulate realistic usage rather than isolated page interactions.

The implementation shall not be modified unless an End-to-End defect is discovered.

---

# Testing Framework

Use

- Playwright
- Chromium
- Firefox
- WebKit (where practical)

Generate

- HTML Report
- Screenshots on failure
- Videos on failure
- Execution traces
- Console logs

All reports must be retained as testing artifacts.

---

# Test Environment

Run against

- Clean test database
- Seeded academic data
- Seeded users
- Seeded departments
- Seeded courses
- Seeded curriculum
- Seeded academic calendar

Each test should execute independently.

No test should depend on another test.

---

# User Roles

Execute scenarios for

- Student
- Lecturer
- Head of Department (HOD)
- Administrator

---

# Student Journey

Execute the following workflow

Student Login

↓

Dashboard

↓

View Academic Progress

↓

View Registered Courses

↓

View Attendance

↓

View Assessments

↓

View Results

↓

View Transcript

↓

Update Academic Goal

↓

Receive Notifications

↓

Logout

Verify

- Dashboard statistics
- Progress calculations
- GPA
- CGPA
- Classification
- Attendance percentage
- Notifications
- Transcript accuracy

---

# Lecturer Journey

Execute

Login

↓

Dashboard

↓

Assigned Courses

↓

Take Attendance

↓

Create Assessment

↓

Upload Assessment Scores

↓

Submit Results

↓

View Submission Status

↓

Logout

Verify

- Attendance stored
- Assessment created
- Scores calculated
- Results submitted
- Audit logs generated

---

# Head of Department Journey

Execute

Login

↓

Dashboard

↓

Review Submitted Results

↓

Approve Results

↓

Publish Results

↓

View Department Analytics

↓

Logout

Verify

- Approval workflow
- Publication workflow
- Dashboard updates
- Notifications generated
- Transcript updates
- Progress recalculation

---

# Administrator Journey

Execute

Login

↓

Dashboard

↓

Manage Users

↓

Manage Departments

↓

Manage Programmes

↓

Manage Academic Calendar

↓

Manage Grade Scale

↓

Manage Classification Rules

↓

Manage System Configuration

↓

Logout

Verify

- CRUD operations
- Configuration persistence
- Permission enforcement
- Audit logging

---

# Cross-Role Workflow

Execute one complete academic lifecycle.

Administrator

↓

Creates Academic Session

↓

Creates Semester

↓

Creates Academic Calendar

↓

Creates Courses

↓

Creates Course Offerings

↓

Assigns Lecturer

↓

Creates Students

↓

Creates Grade Scale

↓

Creates Classification Scheme

↓

Publishes Configuration

↓

Student

↓

Registers Courses

↓

Lecturer

↓

Records Attendance

↓

Creates Assessments

↓

Uploads Scores

↓

Submits Results

↓

HOD

↓

Approves Results

↓

Publishes Results

↓

Student

↓

Receives Notification

↓

Views Dashboard

↓

Views Updated Transcript

↓

Views Updated GPA

↓

Views Updated Classification

Verify every state transition.

---

# Negative End-to-End Scenarios

Verify

Student

- Cannot access lecturer routes
- Cannot access admin routes
- Cannot register outside Academic Calendar
- Cannot exceed credit limits

Lecturer

- Cannot approve results
- Cannot edit published results

HOD

- Cannot modify system configuration

Administrator

- Cannot impersonate users
- Cannot violate business rules

Anonymous User

- Cannot access protected pages
- Redirected to login

---

# Browser Compatibility

Execute on

- Chromium
- Firefox
- WebKit

Record browser-specific failures.

---

# Responsive Testing

Verify

Desktop

Tablet

Mobile

Confirm

- Navigation
- Tables
- Forms
- Dashboard
- Transcript

remain usable.

---

# Accessibility Validation

Verify

- Keyboard navigation
- Focus order
- Form labels
- Error messages
- Color contrast
- ARIA roles (where applicable)

Document accessibility issues.

---

# Error Recovery

Verify application behavior when

- Session expires
- Network interruption occurs
- Invalid URLs requested
- Server returns errors
- Database temporarily unavailable

The application should fail gracefully.

---

# Performance Observation

Record

- Login time
- Dashboard load time
- Transcript generation time
- Result publication time
- Notification delivery time

Document observed response times.

---

# Required Assertions

Every scenario must verify

UI

Business Logic

Database State

Event Propagation

Notification Generation

Dashboard Snapshot

Audit Log Creation

Authorization

---

# Required Artifacts

Generate

- Playwright HTML Report
- Screenshots for failed tests
- Videos for failed tests
- Execution traces
- Console logs
- Test summary
- Browser compatibility report

---

# Test Case Format

Every test shall include

- Test ID
- Requirement ID
- Scenario
- Preconditions
- Steps
- Expected Result
- Actual Result
- Status

Status values

- PASS
- FAIL
- BLOCKED
- SKIPPED

---

# Success Criteria

The End-to-End phase is complete only when

- All primary user journeys execute successfully.
- Cross-role workflows complete successfully.
- Browser compatibility has been verified.
- Responsive behavior has been verified.
- Negative scenarios pass.
- No unexpected failures remain.
- Playwright reports have been generated.
- Screenshots, traces, and execution logs have been archived.

If any scenario fails, document the defect, resolve it, rerun the affected scenarios, and perform regression testing before proceeding.

Only after successful completion of this phase may the project proceed to Documentation and Deployment.