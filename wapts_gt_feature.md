# Feature Addition — Student Academic Goal Tracking & CGPA Projection

## Objective

Introduce a **Goal Tracking** module that enables students to set academic goals and receive intelligent projections based on their current academic standing.

The system should not merely store a target CGPA—it should analyze the student's transcript and provide actionable guidance such as:

> "You need to maintain an average GPA of 4.15 over the next four semesters to graduate with a CGPA of 3.50."

This feature should encourage students to monitor their academic progress and make informed decisions throughout their programme.

---

# Design Principles

The Goal Tracking module should:

- Be available only to students.
- Calculate projections using actual academic records.
- Update automatically whenever new results are published.
- Clearly communicate whether the student's goal is achievable.
- Never modify academic records—only analyze them.

---

# Student Dashboard

Add a new dashboard card:

```
Academic Goal

Current CGPA

2.81

Target CGPA

3.50

Progress

80%

View Goal Tracker →
```

---

# Goal Tracking Page

Create a dedicated page.

```
Academic Goal Tracker

------------------------------------

Current CGPA

2.81

Programme

Software Engineering

Current Level

200

Credits Completed

52

Credits Remaining

96

------------------------------------

Target CGPA

[ 3.50 ]

Expected Graduation Session

▼ 2028/2029

------------------------------------

Save Goal
```

---

# Student Goal Model

Create a new entity:

```
AcademicGoal
```

Suggested fields:

```text
student

targetCGPA

currentCGPA

creditsCompleted

creditsRemaining

expectedGraduationSession

createdAt

updatedAt
```

Each student should have only one active academic goal.

---

# Goal Calculation Engine

Whenever the student saves or updates a goal:

Automatically calculate:

- Current CGPA
- Credits completed
- Credits remaining
- Required average GPA
- Graduation projection
- Goal feasibility

---

# Example

Current CGPA

```
2.81
```

Credits Completed

```
52
```

Credits Remaining

```
96
```

Target

```
3.50
```

System calculates:

```
You need an average GPA of 4.15
over your remaining 96 credits
to graduate with a CGPA of 3.50.
```

---

# Goal Status

Display one of three statuses.

## On Track

Example:

```
Current Performance

3.65

Required

3.50

Status

✓ On Track
```

---

## At Risk

Example:

```
Required GPA

4.60

Current Semester GPA

3.20

Status

⚠ At Risk
```

---

## Not Currently Achievable

Example:

```
Target

4.90

Maximum Possible

4.55

Status

Not Achievable
```

Provide explanation:

```
Even with perfect grades in all
remaining courses, this target
cannot be achieved.
```

---

# Academic Projection

Display projected graduation CGPA.

Example:

```
If you continue performing
at your current average:

Projected CGPA

3.18
```

---

# What-If Analysis

Allow students to experiment.

```
What if I average:

▼ 4.00

↓

Projected Graduation CGPA

3.36
```

Examples:

```
Average 3.00

↓

Graduate with 3.05
```

```
Average 4.00

↓

Graduate with 3.38
```

```
Average 5.00

↓

Graduate with 3.71
```

This should not modify any stored data.

---

# Semester Projection

Display a semester-by-semester requirement.

Example:

```
Remaining Semesters

First Semester 300

Required GPA

4.20

--------------------

Second Semester 300

Required GPA

4.20

--------------------

First Semester 400

Required GPA

4.10

--------------------

Second Semester 400

Required GPA

4.10
```

---

# Performance Trend

Display:

```
Semester GPA History

2024 First Semester

3.12

2024 Second Semester

3.45

2025 First Semester

3.26

2025 Second Semester

3.61
```

Include a simple line chart.

---

# Goal Insights

Generate intelligent messages.

Examples:

```
Excellent improvement.

Your GPA has increased for
three consecutive semesters.
```

```
Your recent performance is
below the GPA required to
reach your goal.
```

```
Maintaining your current
performance will result in
an estimated CGPA of 3.28.
```

---

# Academic Classification

Show current and projected degree classification.

Example:

```
Current

Second Class Lower
```

Projected

```
Second Class Upper
```

If the institution has configurable grade classifications, use the active Grade Scale rather than hardcoding thresholds.

---

# Goal Notifications

Notify students when:

- New results are published.
- Goal projection changes.
- Target becomes unattainable.
- Student moves back on track.

Example:

```
Your updated CGPA is now 3.18.

You now need an average GPA
of 3.82 to achieve your goal.
```

---

# Automatic Updates

Whenever results are published:

Automatically recalculate:

- Current CGPA
- Credits completed
- Credits remaining
- Required GPA
- Projection
- Classification

Students should never need to refresh or recreate their goals.

---

# Backend Service

Create:

```
GoalTrackingService
```

Responsibilities:

- CGPA calculations
- Remaining credit calculations
- Goal feasibility
- Projection engine
- Classification prediction
- Insight generation

All calculations should occur on the server.

---

# Validation

Reject:

```
Target CGPA

6.0
```

Reject:

```
Target CGPA

-1
```

Reject:

Target lower than minimum allowable.

Reject:

Target greater than the institution's maximum GPA.

---

# User Interface

Layout:

```
Current CGPA

Target CGPA

Required GPA

Credits Remaining

Projected Graduation CGPA

Degree Classification

Goal Status

Performance Trend

What-If Calculator
```

Use Bootstrap cards and progress bars for clarity.

---

# Permissions

Only students may:

- Create goals
- Update goals
- View projections

Lecturers, Level Coordinators, HODs, and Administrators should not edit student goals.

(Optional future enhancement: advisors/HODs may have read-only access.)

---

# Automated Testing

## Unit Tests

Verify:

- CGPA calculation
- Remaining credit calculation
- Required GPA calculation
- Projection accuracy
- Goal validation
- Classification prediction

---

## Integration Tests

Verify:

- Goal creation
- Goal updates
- Automatic recalculation after result publication
- Projection updates
- Notification generation

---

## End-to-End Tests

Scenario 1

```
Student Login

↓

Open Goal Tracker

↓

Set Target CGPA

↓

Save

↓

Projection Generated
```

Scenario 2

```
Results Published

↓

Goal Automatically Updated

↓

Student Receives Notification
```

Scenario 3

```
Student Uses What-If Calculator

↓

Projection Changes

↓

Stored Goal Remains Unchanged
```

---

# Documentation

Update project documentation to include:

- Goal Tracking architecture
- Projection engine
- Required GPA calculation
- Goal feasibility rules
- What-If analysis
- Automatic recalculation workflow

---

# Success Criteria

The implementation is complete only when:

- Students can create and update a target CGPA.
- The system automatically calculates the current CGPA from published results.
- Remaining credits are calculated automatically.
- The required average GPA is calculated accurately.
- The system determines whether the goal is achievable.
- Projected graduation CGPA is displayed.
- Current and projected degree classifications are shown.
- A What-If calculator allows students to simulate future performance without changing stored data.
- Goal projections automatically update whenever new results are published.
- Insight messages provide meaningful academic guidance.
- All calculations occur server-side.
- All Unit, Integration, and End-to-End tests pass successfully.
- The Goal Tracking module provides a comprehensive academic planning experience rather than simply storing a target CGPA.
