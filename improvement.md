# WAPTS Final Architecture Refinement Directive


# 2. Notification Model

NotificationService currently exists without a corresponding domain entity.

Introduce Notification.

## Notification

Fields

- recipient
- title
- message
- type
- priority
- isRead
- readAt
- createdAt
- expiresAt (optional)

Notification types may include

- Academic Warning
- Result Published
- Attendance Warning
- Goal Progress
- Course Assignment
- System Announcement

NotificationService becomes responsible for creation, retrieval, and archival.

---

# 3. Dashboard Snapshot Refinement

DashboardSnapshot currently stores a generic JSON metrics object.

Replace this with strongly typed fields.

Example

- currentGPA
- currentCGPA
- attendancePercentage
- creditsEarned
- creditsRemaining
- currentClassification
- expectedClassification
- riskLevel
- goalProgress
- lastUpdated

Optional

metadata

may be retained for non-critical extensibility.

The application should query explicit fields rather than parsing JSON blobs.

---

# 4. Assessment Type Normalization

Assessment currently stores assessmentType as a string.

Replace this with a dedicated AssessmentType model.

## AssessmentType

Fields

- name
- description
- defaultWeight
- isActive

Assessment references AssessmentType instead of storing arbitrary strings.

This prevents inconsistent values and simplifies administration.

---

# 5. Academic Classification Model

Graduation classifications must never be hardcoded.

Introduce Classification.

## Classification

Fields

- name
- minimumCGPA
- maximumCGPA
- description
- isActive

Examples

First Class

Second Class Upper

Second Class Lower

Third Class

Pass

ProgressService must calculate

Current Classification

Expected Graduation Classification

Remaining CGPA required for next classification

using Classification records.

---

# 6. Event Bus Specification

The architecture references an Event Bus but does not define its implementation.

Adopt Node.js EventEmitter (or EventEmitter2) as the internal application event bus.

Business events include

- Student Enrolled
- Attendance Recorded
- Assessment Updated
- Result Submitted
- Result Approved
- Result Published
- Goal Updated
- Session Activated
- Session Closed
- Configuration Updated

Services should publish and subscribe to events rather than directly invoking unrelated services whenever practical.

---

# 7. Audit Logging Model

Audit logging must become a first-class domain entity.

Introduce AuditLog.

## AuditLog

Fields

- user
- action
- resource
- resourceId
- previousState (optional)
- newState (optional)
- ipAddress
- userAgent
- createdAt

Audit logging should capture all privileged operations.

Examples

- Login
- Logout
- Configuration Changes
- Result Approval
- Result Publication
- Course Allocation
- User Creation
- User Suspension

---

# 8. Storage Abstraction

File storage must be abstracted.

Introduce StorageService.

StorageService delegates to storage providers.

Development

LocalStorageProvider

Production

CloudinaryProvider

No controller or service outside StorageService should directly interact with the filesystem or Cloudinary.

Supported uploads

- Profile Images
- CSV Imports
- Generated Transcript Exports

---

# 9. System Settings Enhancement

SystemSettings should reference configurable grading and classification schemes.

Add

- activeGradeScale
- activeClassificationScheme

These should reference their respective collections rather than embedding grading logic.

This allows institutions to switch grading policies without code changes.

---

# 10. Database Index Strategy

Explicit database indexes must be defined.

Recommended indexes

User

- loginIdentifier (unique)

Course

- code (unique)

Enrollment

- student + courseOffering (compound)

AttendanceRecord

- attendanceSession + student (compound)

Assessment

- courseOffering

Result

- enrollment (unique)

DashboardSnapshot

- user

Notification

- recipient
- isRead

AuditLog

- user
- createdAt

Indexes should be declared within Mongoose schemas.

---

# 11. Transaction Policy

Critical workflows must execute inside MongoDB transactions.

Required transactional operations

- Result Publication
- Enrollment
- Bulk Imports
- Course Registration
- Curriculum Updates
- Configuration Changes

Transactions must guarantee consistency across all affected collections.

---

# 12. Scheduler Standards

SchedulerService should implement

- Job registration
- Retry policy
- Execution logging
- Failure logging

Scheduled jobs include

- Dashboard refresh
- Notification archival
- Academic session rollover
- Maintenance tasks
- Optional backups

Use node-cron.

---

# 13. Bulk Import Rollback

Bulk imports must support rollback.

Workflow

Upload

↓

Validate

↓

Preview

↓

Confirm

↓

Begin Transaction

↓

Import

↓

Commit

If any unrecoverable error occurs

↓

Rollback Transaction

↓

Generate Import Report

No partial imports should remain in the database.

---

# 14. Layer Responsibility Rules

Enforce strict separation of concerns.

Controllers

- Accept requests
- Validate input
- Invoke services
- Return responses

Controllers must never communicate directly with Mongoose models.

Services

- Contain all business logic
- Coordinate domain operations
- Publish business events

Services must never render views.

Models

- Represent persistence only
- Define schema, validation, indexes, and relationships

Models must never contain request or presentation logic.

Routes

- Register endpoints
- Apply middleware
- Forward requests to controllers

Routes must never contain business logic.

Views

- Display data only

Views must never perform calculations or business logic.

---

# 15. Architecture Freeze

After these refinements are incorporated, the architecture shall be considered stable.

No additional

- models
- services
- workflows
- architectural layers
- business processes

may be introduced unless explicitly approved.

Future work should focus exclusively on implementation according to the approved architecture.

All implementation decisions must remain consistent with the finalized architecture.