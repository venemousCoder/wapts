# Architecture Revision — Unified Authentication System

## Objective

Simplify the authentication flow by replacing the multiple role-specific login tabs with a single unified login form.

Authentication must only determine **who the user is**.

Authorization (role determination and dashboard routing) must occur **entirely on the server** after successful authentication.

The client must never decide or specify the user's role.

---

# Design Principles

The authentication process shall follow these principles:

- One login form for every user.
- One authentication endpoint.
- One authentication controller.
- Role determined from the database.
- Automatic redirection after successful login.
- No role selection on the client.

---

# Remove Role-Based Login Tabs

Remove the following UI elements from the login page:

- Student
- Staff
- Administrator

The login page must not ask the user to choose a role before authentication.

---

# New Login Interface

Replace the current interface with a single authentication form.

Required fields:

## Identifier

Label

```
Identifier
```

Placeholder

```
Registration Number or Institution Email
```

Accepted values:

- Student Registration Number
- Institution-issued Email Address

---

## Password

Label

```
Password
```

Placeholder

```
Enter your password
```

---

## Remember Me

Retain the existing functionality.

---

## Forgot Password

Retain the existing functionality.

---

## Sign In

Retain the existing functionality.

---

# Authentication Workflow

Replace the existing role-dependent login flow with the following.

```text
User
        ↓
Enter Identifier
        ↓
Enter Password
        ↓
Submit Login Form
        ↓
Authentication Controller
        ↓
Locate User
        ↓
Verify Password
        ↓
Determine Role
        ↓
Create Session
        ↓
Redirect to Appropriate Dashboard
```

---

# Server-Side Authentication Logic

The authentication controller shall perform the following steps.

```text
Receive Identifier
        ↓
Search Users Collection
        ↓
User Found?
        ↓
No
        ↓
Return Invalid Credentials
        ↓
Yes
        ↓
Verify Password
        ↓
Password Valid?
        ↓
No
        ↓
Return Invalid Credentials
        ↓
Yes
        ↓
Read User Role
        ↓
Create Session
        ↓
Redirect User
```

The client must never submit a role.

---

# Identifier Resolution

The authentication controller shall automatically determine the type of identifier.

Examples

## Student

Input

```
SWE/22/001
```

Lookup

```
Student Registration Number
        ↓
Student Profile
        ↓
Linked User
```

---

## Lecturer

Input

```
lecturer@university.edu.ng
```

Lookup

```
User Email
```

---

## HOD

Input

```
hod@university.edu.ng
```

Lookup

```
User Email
```

---

## Administrator

Input

```
admin@university.edu.ng
```

Lookup

```
User Email
```

The user should not need to know which identifier type is being used internally.

---

# Role Resolution

After authentication succeeds, determine the user's role from the database.

Example

```text
User Authenticated
        ↓
Read users.role
        ↓
Student
        ↓
Redirect → /student/dashboard

Lecturer
        ↓
Redirect → /lecturer/dashboard

HOD
        ↓
Redirect → /hod/dashboard

Administrator
        ↓
Redirect → /admin/dashboard
```

Do not use client-provided information for routing.

---

# Session Creation

After successful authentication:

- Create authenticated session.
- Store User ID.
- Store Role.
- Store Department (where applicable).
- Store permissions if implemented.

The session becomes the source of truth for authorization.

---

# Authorization

Authentication and authorization must remain separate.

Authentication verifies:

- Identity
- Password

Authorization determines:

- Accessible routes
- Dashboard
- Features
- Permissions

Every protected route must continue to validate authorization on the server.

---

# Error Handling

Provide consistent authentication errors.

Supported states:

## Invalid Identifier

```
Invalid identifier or password.
```

---

## Invalid Password

```
Invalid identifier or password.
```

Do not reveal which field was incorrect.

---

## Account Disabled

```
Your account has been disabled.
Please contact your department.
```

---

## Pending Lecturer Approval

```
Your lecturer account request is awaiting HOD approval.
```

---

## Rejected Lecturer Request

```
Your lecturer account request has been rejected.
Please contact your Head of Department.
```

---

## First Login Required

If the account uses a temporary password:

```text
Authenticate
        ↓
Temporary Password?
        ↓
Yes
        ↓
Force Password Change
```

The user must not access the dashboard until the password has been changed.

---

# Login Page UI

Update the login page.

Keep:

- Branding
- Illustration
- Responsive layout
- Remember Me
- Forgot Password

Remove:

- Student Tab
- Staff Tab
- Administrator Tab

Replace with a single login form.

---

# Login Controller

Refactor the authentication controller to:

- Accept one identifier field.
- Resolve whether the identifier is an email or registration number.
- Authenticate against the Users collection.
- Determine the role from the database.
- Create the authenticated session.
- Redirect automatically.

Do not maintain separate login handlers for different roles.

---

# Route Protection

Continue enforcing server-side authorization.

Examples

Student

```
/student/*
```

Accessible only by authenticated students.

---

Lecturer

```
/lecturer/*
```

Accessible only by authenticated lecturers.

---

HOD

```
/hod/*
```

Accessible only by authenticated HODs.

---

Administrator

```
/admin/*
```

Accessible only by authenticated administrators.

Unauthorized access must return the appropriate HTTP status and error page.

---

# Automated Testing

Update the testing suite.

## Unit Tests

Verify:

- Identifier parsing
- User lookup
- Password verification
- Session creation
- Role resolution

---

## Integration Tests

Verify:

Student Login

```
Registration Number
        ↓
Authenticated
        ↓
Student Dashboard
```

Lecturer Login

```
Institution Email
        ↓
Authenticated
        ↓
Lecturer Dashboard
```

HOD Login

```
Institution Email
        ↓
Authenticated
        ↓
HOD Dashboard
```

Administrator Login

```
Institution Email
        ↓
Authenticated
        ↓
Administrator Dashboard
```

---

## End-to-End Tests

Verify:

- Student login
- Lecturer login
- HOD login
- Administrator login
- Invalid credentials
- Disabled account
- Pending lecturer request
- First-login password change
- Logout
- Remember Me functionality

---

# Documentation

Update the following documentation:

- Authentication Architecture
- Login Workflow
- Session Management
- Authorization Flow
- Testing Documentation

Remove all references to role-selection during login.

---

# Success Criteria

This revision is complete only when:

- A single login form is used for all users.
- Role-selection tabs have been removed.
- The client no longer submits or selects a role.
- Authentication accepts registration numbers and institution-issued email addresses.
- User identity is resolved entirely on the server.
- Roles are determined exclusively from the database.
- Users are automatically redirected to the correct dashboard after authentication.
- Authorization remains fully enforced on protected routes.
- Pending lecturer requests and temporary-password workflows are supported.
- All Unit, Integration, and End-to-End tests pass successfully.
- The login interface is simpler, more maintainable, and follows a clear separation between authentication and authorization.
