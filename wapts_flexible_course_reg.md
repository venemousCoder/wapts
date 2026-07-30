# Architecture Revision — Flexible Course Registration by Level Coordinators

## Objective

Revise the student registration architecture to support real-world academic registration workflows by allowing Level Coordinators to register both normal and exceptional course combinations.

Instead of restricting Level Coordinators to selecting only courses for their assigned level, they should be able to access **all published Course Offerings within their department** while remaining constrained by institutional business rules.

This enables proper handling of:

- Carry-over students
- Spill-over students
- Transfer students
- Deferred students
- Special academic approvals

without requiring intervention from the HOD.

---

# Guiding Principles

- The HOD remains the academic authority.
- The HOD owns curriculum and Course Offerings.
- Level Coordinators own student registration.
- Registration flexibility is controlled by business rules, not artificial UI restrictions.
- Every registration action must be validated server-side.

---

# Responsibilities

## Head of Department (HOD)

Responsible for:

- Creating Courses
- Creating Course Offerings
- Publishing Course Offerings
- Assigning Lecturers
- Assigning Level Coordinators
- Managing departmental curriculum

The HOD **does not** perform routine student registration.

---

## Level Coordinator

Responsible for:

- Registering students
- Applying recommended registrations to an entire cohort
- Managing individual registrations
- Adding carry-over courses
- Removing courses where appropriate
- Handling late registrations
- Managing spill-over students
- Managing transfer students
- Managing special academic approvals

---

# Published Course Offerings

When registering students, the coordinator should have access to:

```
Published Course Offerings
```

Only.

Do **not** display:

- Draft offerings
- Archived offerings
- Closed offerings

Only offerings with status:

```
Published
```

should be selectable.

---

# Registration Interface

Replace restrictive level-only registration with a smarter interface.

Example:

```
Register Courses

Student:
Ahmed Musa

Level:
200

--------------------------------

Recommended Courses

✓ SWE201

✓ CSC203

✓ MTH201

✓ GST211

--------------------------------

Other Published Departmental Offerings

100 Level

□ SWE101

□ CSC102

□ MTH101

300 Level

□ SWE301

□ CSC305
```

The interface should clearly distinguish:

- Recommended courses
- Additional available offerings

without preventing valid exceptions.

---

# Recommended Curriculum

For normal students:

The coordinator should be able to click:

```
Apply Recommended Registration
```

The system should automatically register:

- All recommended published Course Offerings for the student's level
- Within the active Academic Session
- Within the active Semester

This eliminates repetitive manual registration.

---

# Individual Registration Management

After the recommended registration has been applied, the coordinator should be able to manage individual students.

Available actions:

```
+ Add Course

− Remove Course
```

Examples:

- Carry-over courses
- Transfer adjustments
- Spill-over registrations
- Approved substitutions
- Late registrations

---

# Carry-over Support

Example:

Student:

```
Level

200
```

Recommended registration:

```
SWE201

CSC201

MTH201

GST211
```

Carry-over:

```
SWE101

CSC102
```

Final registration:

```
SWE201

CSC201

MTH201

GST211

SWE101

CSC102
```

The system should permit this provided all validation rules pass.

---

# Business Rules

Course registration should be governed by validation rather than UI restrictions.

The backend must verify:

---

## Department Validation

Course Offering must belong to the student's department.

Reject offerings from other departments.

---

## Offering Status

Only Published Course Offerings may be registered.

Reject:

- Draft
- Archived
- Closed

---

## Active Session Validation

Course Offering must belong to:

- Active Academic Session
- Active Semester

---

## Duplicate Registration

Reject if the student is already registered for the selected Course Offering.

---

## Previously Passed Courses

Prevent registration for courses the student has already successfully completed unless an institutional override policy exists.

---

## Credit Load Validation

Calculate:

```
Total Registered Credits
```

Compare against:

```
Maximum Credit Load
```

configured in System Settings.

Example:

```
Current Registration

18 Credits

Carry-over

6 Credits

Total

24 Credits

Maximum

24 Credits

✓ Allowed
```

Example:

```
Current Registration

21 Credits

Carry-over

6 Credits

Total

27 Credits

Maximum

24 Credits

✗ Reject
```

Return a meaningful validation error.

---

## Minimum Credit Load

After registration is complete, verify:

```
Total Credits

>= Minimum Credit Load
```

unless an approved exception exists.

---

# Cohort Registration

Allow coordinators to register an entire level simultaneously.

Workflow:

```
Select Level

↓

Apply Recommended Registration

↓

Select Cohort

↓

Register All Eligible Students
```

The system should register every eligible student using the recommended published Course Offerings.

---

# Individual Overrides

After cohort registration, coordinators should be able to manage individual students.

Example:

```
Ahmed Musa

Current Registration

------------------

SWE201

CSC201

GST211

------------------

Add Course

Remove Course
```

Changes should affect only that student.

---

# Registration History

Maintain a complete audit trail.

Record:

- Coordinator
- Student
- Added Course
- Removed Course
- Timestamp
- Reason (optional)

Example:

```
Registration Audit

Coordinator:
Dr. Ibrahim

Student:
Ahmed Musa

Action:
Added SWE101

Reason:
Carry-over

Date:
2026-09-14
```

---

# User Interface

Separate the page into two sections.

```
Recommended Registration

Apply to Cohort
```

and

```
Individual Student Registration

Add Course

Remove Course
```

This keeps bulk operations separate from exceptional cases.

---

# Backend

Retain existing Course and Course Offering models.

Enhance the registration service to support:

- Cohort registration
- Individual overrides
- Credit validation
- Duplicate prevention
- Published offering enforcement
- Department validation

No major schema redesign should be required.

---

# Automated Testing

## Unit Tests

Verify:

- Credit calculations
- Duplicate prevention
- Passed-course validation
- Published offering validation
- Department validation

---

## Integration Tests

Verify:

- Cohort registration
- Individual registration
- Carry-over registration
- Credit limit enforcement
- Duplicate rejection

---

## End-to-End Tests

### Cohort Registration

```
Coordinator Login

↓

Select Level

↓

Apply Recommended Registration

↓

Students Registered Successfully
```

---

### Carry-over Registration

```
Coordinator Login

↓

Open Student

↓

Add 100-Level Course

↓

Validation Passes

↓

Registration Saved
```

---

### Credit Limit

```
Coordinator Login

↓

Attempt Registration

↓

Credits Exceed Maximum

↓

Validation Error Displayed
```

---

### Invalid Offering

```
Attempt to Register Draft Course

↓

Rejected
```

---

### Duplicate Registration

```
Attempt to Register Existing Course

↓

Rejected
```

---

# Documentation

Update project documentation to include:

- Flexible course registration workflow
- Recommended vs individual registration
- Carry-over registration process
- Credit load enforcement
- Registration validation rules
- Registration audit trail

Update architecture diagrams to show:

```
HOD
    ↓
Publishes Course Offerings

Level Coordinator
    ↓
Registers Students

Recommended Registration
        +
Individual Overrides

↓

Student Registration
```

---

# Success Criteria

This revision is complete only when:

- Level Coordinators can access all **published** Course Offerings within their department.
- Recommended registrations can be applied to an entire cohort.
- Coordinators can add or remove courses for individual students.
- Carry-over, spill-over, transfer, and exceptional registrations are fully supported.
- Registration is validated using institutional business rules rather than level-based UI restrictions.
- Maximum and minimum credit loads are enforced.
- Duplicate registrations are prevented.
- Only published Course Offerings are selectable.
- Complete registration audit logs are maintained.
- All Unit, Integration, and End-to-End tests pass successfully.
- The registration workflow scales efficiently while remaining academically accurate and administratively flexible.
