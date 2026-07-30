# Architecture Revision — Shift Student Registration to the Head of Department (HOD)

## Objective

Revise the user onboarding workflow so that **student registration becomes a departmental responsibility** rather than a system-wide administrative task.

The Administrator should remain responsible for managing the institution and its global configuration, while each Head of Department (HOD) manages the students within their own department.

This change better reflects real-world university workflows and distributes administrative responsibilities across departments.

---

# Updated Responsibility Matrix

## Administrator Responsibilities

The Administrator manages **institution-wide resources**.

Responsibilities include:

- Manage Administrator accounts
- Create and manage HOD accounts
- Manage Departments
- Manage Academic Sessions
- Manage Semesters
- Manage Grade Scales
- Manage Faculties (if implemented)
- Manage System Settings
- View System-wide Analytics
- Configure Authentication and Security

The Administrator **must not** register individual students.

---

## Head of Department Responsibilities

The HOD manages all academic data within their assigned department.

Responsibilities include:

- Register Students
- Import Students in Bulk (CSV/Excel)
- Edit Student Academic Profiles
- Activate or Deactivate Student Accounts
- Promote Students to the Next Academic Level
- Assign Academic Advisers (if implemented)
- Review Results
- Approve Results
- Publish Results
- View Department Analytics

The HOD may only manage students belonging to **their own department**.

---

# Revised Student Registration Workflow

Replace the existing workflow with the following.

```text
Administrator
        ↓
Create Department
        ↓
Create HOD Account
        ↓
Assign Department
        ↓
Grant Department Permissions
        ↓
HOD Logs In
        ↓
Registers Students
        ↓
System Creates User Account
        ↓
System Creates Student Profile
        ↓
Temporary Password Generated
        ↓
Student Receives Credentials
        ↓
Student Logs In
        ↓
Student Changes Password
```

---

# Bulk Student Import

Implement a bulk import feature within the HOD module.

Supported formats:

- CSV
- Excel (.xlsx)

The import process shall:

```
Upload File
        ↓
Validate File Format
        ↓
Validate Required Fields
        ↓
Detect Duplicate Registration Numbers
        ↓
Detect Duplicate Emails
        ↓
Verify Department Ownership
        ↓
Create User Accounts
        ↓
Create Student Profiles
        ↓
Generate Temporary Passwords
        ↓
Generate Import Summary
```

---

# Required Student Fields

Every imported or manually registered student must include:

- Full Name
- Registration Number
- Email Address
- Department
- Programme
- Level
- Admission Session

Optional fields may include:

- Phone Number
- Date of Birth
- Gender
- Academic Adviser
- Profile Photo

---

# Database Operations

For every successful registration, the system shall create:

## User Document

Contains authentication data only.

Example fields:

- Name
- Email
- Password (hashed)
- Role = Student
- Status

---

## Student Profile Document

Contains academic information only.

Example fields:

- User Reference
- Registration Number
- Department
- Programme
- Level
- Admission Session
- Current Semester
- Academic Adviser (optional)

Authentication and academic data must remain separate.

---

# Access Control

Enforce department-level authorization.

A HOD:

- May register students only within their department.
- May edit only students within their department.
- May view only students belonging to their department.
- Must not access student records belonging to another department.

Attempts to bypass these restrictions must return an authorization error.

---

# Student Registration Interface

Replace placeholder pages with a functional interface.

Features should include:

- Responsive student table
- Search
- Filter by level
- Filter by programme
- Filter by admission session
- Pagination
- Manual registration form
- Bulk import option
- Edit student details
- Activate/deactivate student accounts
- Delete (only where permitted by business rules)
- View student profile

All operations must interact with live backend endpoints.

---

# Registration Validation

Validate before creating any records.

Checks include:

- Registration Number is unique
- Email is unique
- Required fields are present
- Department matches the logged-in HOD
- Programme exists
- Academic Session exists
- Level is valid

Invalid submissions must display clear validation errors.

---

# Temporary Password Workflow

Upon successful registration:

- Generate a secure temporary password.
- Hash the password before storing it.
- Associate it with the newly created user.
- Display or export the credentials securely for distribution.

On first login, the student must be required to change the temporary password before accessing the system.

---

# Import Summary Report

After every bulk import, generate a summary showing:

- Total records processed
- Successfully imported
- Failed records
- Duplicate registration numbers
- Duplicate emails
- Validation errors

If a record fails validation, report the reason without stopping the entire import.

---

# Audit Logging

Every registration operation must create an audit log.

Record:

- HOD performing the action
- Department
- Student registered
- Timestamp
- Action type (Create / Update / Import)

This supports traceability and accountability.

---

# Automated Testing

Update the testing suite to include:

### Unit Tests

- Student registration service
- CSV/Excel import validation
- Duplicate detection
- Department authorization

### Integration Tests

- HOD → Student registration workflow
- User creation
- Student profile creation
- Audit log generation

### End-to-End Tests

Verify the complete workflow:

```
HOD Login
        ↓
Register Student
        ↓
User Created
        ↓
Student Profile Created
        ↓
Temporary Password Generated
        ↓
Student Login
        ↓
Password Change Required
        ↓
Student Dashboard Accessible
```

Also verify bulk import scenarios, including successful imports and validation failures.

---

# Deliverables

Update the following modules:

- HOD Dashboard
- HOD Student Management
- Student Registration Interface
- Bulk Import Module
- Authentication Flow
- Authorization Rules
- Audit Logging
- Unit Tests
- Integration Tests
- End-to-End Tests
- Documentation

---

# Success Criteria

This revision is complete only when:

- Student registration is removed from the Administrator module.
- Student registration is fully available within the HOD module.
- Bulk CSV/Excel import is implemented.
- User and Student Profile records are created correctly.
- Department-level authorization is enforced.
- Temporary password generation is implemented.
- First-login password change is enforced.
- Audit logs are generated for all registration actions.
- All Unit, Integration, and End-to-End tests pass successfully.
- The entire workflow is accessible through a fully functional frontend.
```
