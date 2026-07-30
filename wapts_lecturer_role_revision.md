# Architecture Revision — Lecturer Self-Service Onboarding with HOD Approval

## Objective

Revise the lecturer onboarding workflow to eliminate manual lecturer account creation by the Administrator.

Instead, lecturers shall initiate their own account requests using their institution-issued email addresses, and the Head of Department (HOD) shall review and approve or reject these requests.

This aligns with the departmental ownership model already adopted for student registration, distributes administrative workload, and provides a more scalable onboarding process.

This revision **does not** introduce any new user roles.

The four existing roles remain:

- Administrator
- Head of Department (HOD)
- Lecturer
- Student

---

# Updated Responsibility Matrix

## Administrator

The Administrator is responsible for institution-wide configuration only.

Responsibilities include:

- Create Departments
- Create HOD Accounts
- Manage Academic Sessions
- Manage Semesters
- Manage Grade Scales
- Manage Faculties (if implemented)
- Manage System Settings
- Configure Authentication
- View System-wide Analytics

The Administrator **shall not create Lecturer accounts**.

---

## Head of Department

The HOD manages personnel and academic records within their assigned department.

Responsibilities include:

- Approve Lecturer Account Requests
- Reject Lecturer Account Requests
- Register Students
- Import Students
- Manage Student Records
- Review Results
- Approve Results
- Publish Results
- View Department Analytics

The HOD may only approve lecturers belonging to their department.

---

## Lecturer

A lecturer is responsible for initiating their own onboarding.

Responsibilities include:

- Submit Account Request
- Update Personal Profile
- Record Attendance
- Create Assessments
- Upload Scores
- Submit Results

A lecturer cannot access the system until their request has been approved.

---

# Revised Lecturer Onboarding Workflow

Replace the existing Administrator-driven workflow with the following.

```text
Lecturer
        ↓
Open Lecturer Registration Page
        ↓
Complete Account Request Form
        ↓
Submit Request
        ↓
System Validates Request
        ↓
Pending Approval
        ↓
HOD Reviews Request
        ↓
Approve / Reject
        ↓
User Account Created
        ↓
Lecturer Profile Created
        ↓
Temporary Password Generated
        ↓
Lecturer Receives Credentials
        ↓
Lecturer Logs In
        ↓
Forced Password Change
```

---

# Lecturer Account Request

Create a dedicated public account request page.

This page is **not** a login page.

It is an onboarding request form.

Required fields:

- Full Name
- Institution-issued Email Address
- Staff Number
- Department
- Phone Number (optional)

Optional fields:

- Academic Rank
- Office Location

Do **not** allow the applicant to choose a system role.

The system shall automatically treat every submission as a Lecturer Account Request.

---

# Institution Email Validation

Only institution-issued email addresses are accepted.

Example

Accepted

```
john.doe@university.edu.ng
```

Rejected

```
john@gmail.com
john@yahoo.com
john@hotmail.com
```

The accepted domain(s) shall be configurable through the System Settings module.

---

# Staff Number Validation

Validate that:

- Staff Number is provided.
- Staff Number is unique.
- Duplicate requests are prevented.

The system must reject duplicate Staff Numbers.

---

# Department Routing

During submission, the lecturer selects their department.

The request shall automatically be routed to the corresponding HOD.

Example

```
Software Engineering

↓

Software Engineering HOD
```

Requests must never be visible to HODs from other departments.

---

# Lecturer Request Queue

Create a new collection:

```
lecturerrequests
```

Example structure

```json
{
    "fullName": "...",
    "email": "...",
    "staffNumber": "...",
    "department": "...",
    "status": "Pending",
    "submittedAt": "...",
    "reviewedBy": null,
    "reviewedAt": null,
    "rejectionReason": null
}
```

Possible statuses:

- Pending
- Approved
- Rejected

Do **not** create a User account until approval.

---

# HOD Review Dashboard

Add a new module to the HOD dashboard.

```
Pending Lecturer Requests
```

Display:

- Name
- Institution Email
- Staff Number
- Department
- Submission Date
- Current Status

Available actions:

- View Details
- Approve
- Reject

Rejecting a request should require a reason.

---

# Approval Workflow

Upon approval

```text
Pending Request
        ↓
Create User
        ↓
Create Lecturer Profile
        ↓
Generate Temporary Password
        ↓
Mark Request Approved
        ↓
Notify Lecturer
```

The original request should remain for audit purposes.

Do **not** delete approved requests.

---

# Rejection Workflow

If rejected

```text
Pending Request
        ↓
Reject
        ↓
Record Reason
        ↓
Notify Applicant
        ↓
Status = Rejected
```

Rejected requests remain available for auditing.

---

# Temporary Password Workflow

After approval

- Generate a secure temporary password.
- Hash the password before storage.
- Associate it with the newly created User account.
- Notify the lecturer of their login credentials.

On first login, force a password change before granting normal system access.

---

# Duplicate Request Prevention

Before creating a new request, verify that:

- No pending request already exists for the same email.
- No pending request already exists for the same Staff Number.
- No approved account already exists.

Display a clear message if a duplicate is detected.

---

# Database Operations

Upon approval

Create:

## User

Contains authentication data only.

Fields include:

- Name
- Email
- Password (hashed)
- Role = Lecturer
- Status

---

## Lecturer Profile

Contains academic information only.

Example fields:

- User Reference
- Staff Number
- Department
- Academic Rank (optional)
- Office Location (optional)

Authentication and academic profile data must remain separate.

---

# Access Control

Enforce department-level authorization.

A HOD:

- May only review requests assigned to their department.
- May not approve requests from another department.
- May not edit Lecturer Profiles outside their department.

Unauthorized attempts must return an authorization error.

---

# Audit Logging

Create audit log entries for:

- Lecturer Request Submitted
- Lecturer Request Approved
- Lecturer Request Rejected
- Lecturer Account Created

Each entry should record:

- User performing the action
- Timestamp
- Department
- Action Type
- Request Identifier

---

# Notifications

Generate notifications for:

## Lecturer

- Request Submitted
- Request Approved
- Request Rejected

## HOD

- New Lecturer Request Received

Notification delivery should integrate with the existing notification system.

---

# User Interface

Replace any placeholder pages with fully functional interfaces.

Required pages:

## Public

- Lecturer Account Request Form

## HOD

- Pending Requests Dashboard
- Lecturer Request Details
- Approval Confirmation
- Rejection Dialog

All interfaces must interact with live backend endpoints.

---

# Automated Testing

Update the testing suite.

## Unit Tests

- Lecturer request validation
- Email validation
- Staff Number validation
- Duplicate detection
- Temporary password generation

---

## Integration Tests

Verify:

- Lecturer Request → HOD Queue
- HOD Approval → User Creation
- HOD Approval → Lecturer Profile Creation
- HOD Rejection → Status Update
- Audit Log Creation
- Notification Creation

---

## End-to-End Tests

Verify the complete onboarding flow.

```text
Lecturer
        ↓
Submit Account Request
        ↓
Pending Queue
        ↓
HOD Login
        ↓
Approve Request
        ↓
User Created
        ↓
Lecturer Profile Created
        ↓
Temporary Password Generated
        ↓
Lecturer Login
        ↓
Password Change
        ↓
Dashboard Access
```

Also test:

- Invalid institution email
- Duplicate Staff Number
- Duplicate email
- Rejected request
- Unauthorized HOD access
- Cross-department approval attempt

---

# Deliverables

Update the following modules:

- Public Lecturer Registration
- HOD Dashboard
- Lecturer Request Queue
- Lecturer Profile Creation
- Authentication Flow
- Authorization Rules
- Notification System
- Audit Logging
- Unit Tests
- Integration Tests
- End-to-End Tests
- Documentation

---

# Success Criteria

This revision is complete only when:

- The Administrator no longer creates Lecturer accounts.
- Lecturers can submit account requests independently.
- Only institution-issued email addresses are accepted.
- Staff Numbers are validated and remain unique.
- Requests are routed to the correct HOD.
- HODs can approve or reject requests within their department only.
- User and Lecturer Profile records are created only after approval.
- Temporary passwords are generated securely.
- First-login password change is enforced.
- Audit logs are generated for every onboarding action.
- Notifications are delivered for submissions, approvals, and rejections.
- All Unit, Integration, and End-to-End tests pass successfully.
- The complete onboarding workflow is available through a fully functional frontend.
- The UI is updated to reflect any changes made
