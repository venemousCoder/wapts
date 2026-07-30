# 08. Navigation Audit Report

## Objectives
Verify that the `layout.ejs` navigation accurately highlights the active path and restricts links based on the user's role.

## Implementations Checked
- **Role-Based Sidebars**: Navigation links are dynamically rendered or hidden depending on `req.user.role`.
- **Active State**: The active navigation item visually reflects the current URL path.
- **Mobile Responsiveness**: The sidebar collapses cleanly on mobile devices using Bootstrap offcanvas or standard toggle behaviors.

## Results
The navigation architecture effectively isolates roles, ensuring a Student cannot access Lecturer paths, not just on the backend route level but visibly on the frontend UI. The breadcrumb and header title consistently indicate the user's location within the system.
