# 3. Functional Specification - All Screens

This document describes all screens and non-screen functions in the system using the following structure:
- Function trigger
- Function description
- Screen layout (wireframe text)
- Function details (data, validation, business rules, normal/abnormal cases)

---

## 3.2 Public and Authentication Features

### 3.2.1 Home Screen (`/`)
**Function trigger**
- Triggered when a user accesses the root domain or navigates back to the home page.
- Navigation path: direct URL, logo click, or redirects after some authentication flows.

**Function description**
- Actor: Public user.
- Purpose: Introduce EduVi and direct users to registration/subscription.
- Interface: Hero section, feature cards, CTA buttons, testimonial/FAQ blocks.

**Screen layout**
```text
[Header]
[Hero + CTA: Start Free | View Pricing]
[Feature grid]
[FAQ/Testimonial]
[Footer]
```

**Function details**
- Data: Mostly static content, with auth-state hydration for potential redirect logic.
- Validation: No form input validation required.
- Normal case: User clicks CTA and navigates to register/subscription.
- Abnormal case: Auth-state hydration fails, but static page still renders.

### 3.2.2 Login Screen (`/login`)
**Function trigger**
- Accessed from Home, Register, Forgot Password, or direct route access.

**Function description**
- Actor: Public user.
- Purpose: Authenticate with username/password or Google login.
- Interface: Login form, show/hide password, forgot-password link.

**Screen layout**
```text
[Logo + Login title]
[Username input]
[Password input + eye icon]
[Login button]
[Google login button]
[Forgot password link]
```

**Function details**
- Data: Username/password input and auth API token response.
- Validation: Username and password are required.
- Business rules: Redirect by role (admin/teacher/expert/staff).
- Normal case: Successful login, token persisted, role-based redirect.
- Abnormal case: Invalid credentials or API failure, display toast/error message.

### 3.2.3 Register Screen (`/register`)
**Function trigger**
- Accessed from Home CTA or register link.

**Function description**
- Actor: Public user.
- Purpose: Create an account and choose a role.
- Interface: Profile form and role selector.

**Screen layout**
```text
[Register title]
[Username][Email][Full name][Phone]
[Password][Confirm password]
[Role selector: Expert/Teacher]
[Submit]
```

**Function details**
- Data: Registration payload with selected role ID.
- Validation: Username length 3-50, strong password, matching confirmation.
- Business rules: Role must match system enum.
- Normal case: Registration succeeds, redirect to Verify OTP.
- Abnormal case: Duplicate email or regex validation failure, block submit and show errors.

### 3.2.4 Verify OTP Screen (`/verify-otp`)
**Function trigger**
- Triggered after successful registration or any flow requiring OTP verification.

**Function description**
- Actor: Newly registered user.
- Purpose: Verify 6-digit OTP.
- Interface: 6 OTP input boxes and resend timer.

**Screen layout**
```text
[OTP title]
[_][_][_][_][_][_]
[Countdown + Resend]
[Verify button]
```

**Function details**
- Data: userId/email and otp.
- Validation: Numeric input only, exactly 6 digits to submit.
- Business rules: Resend action locked while timer > 0.
- Normal case: OTP verified, redirect to Login.
- Abnormal case: Invalid/expired OTP, show error and allow re-entry.

### 3.2.5 Forgot Password Screen (`/forgot-password`)
**Function trigger**
- Accessed from Login via Forgot Password.

**Function description**
- Actor: User who forgot password.
- Purpose: Send reset OTP via email.
- Interface: Email input and send button.

**Screen layout**
```text
[Forgot password title]
[Email input]
[Send OTP button]
```

**Function details**
- Data: Email address.
- Validation: Email is required and must be valid format.
- Normal case: OTP sent successfully, redirect to Reset Password.
- Abnormal case: Email not found or API failure, show error.

### 3.2.6 Reset Password Screen (`/reset-password`)
**Function trigger**
- Accessed after Forgot Password OTP is sent.

**Function description**
- Actor: User resetting password.
- Purpose: Submit OTP and new password.
- Interface: 6-digit OTP, new password, confirm password.

**Screen layout**
```text
[Reset password title]
[OTP 6 boxes]
[New password]
[Confirm password]
[Reset button]
```

**Function details**
- Data: Email/user, otp, newPassword.
- Validation: Strong password, confirmation match, OTP length = 6.
- Business rules: Resend OTP timer behavior similar to Verify OTP.
- Normal case: Reset successful, redirect to Login.
- Abnormal case: Invalid/expired OTP or weak password, display errors.

### 3.2.7 Subscription Screen (`/subscription`)
**Function trigger**
- Accessed from Home CTA or top navigation.

**Function description**
- Actor: Public/authenticated user (staff cannot purchase).
- Purpose: View and purchase subscription plans.
- Interface: Pricing cards and purchase buttons.

**Screen layout**
```text
[Pricing hero]
[Plan card 1][Plan card 2][Plan card 3]
[Buy buttons]
```

**Function details**
- Data: Plan list and wallet balance.
- Validation: User must be authenticated to purchase.
- Business rules: Staff users are redirected to staff dashboard.
- Normal case: Purchase succeeds, quota credited, success notification shown.
- Abnormal case: Insufficient balance or API failure, show error.

### 3.2.8 Contact Screen (`/contact`)
**Function trigger**
- Accessed from footer/menu or direct URL.

**Function description**
- Actor: Public user.
- Purpose: Send support/contact request.
- Interface: Contact information and contact form.

**Screen layout**
```text
[Contact info]
[Name][Email][Subject]
[Message textarea]
[Send button]
```

**Function details**
- Data: Name, email, subject, message.
- Validation: Name, email, and message are required.
- Normal case: Message submitted, form resets.
- Abnormal case: Submission fails, show error.

### 3.2.9 About Screen (`/about`)
**Function trigger**
- Accessed from menu/footer.

**Function description**
- Actor: Public user.
- Purpose: Present mission, vision, and core values.
- Interface: Static informational sections.

**Screen layout**
```text
[About hero]
[Mission/Vision]
[Core values grid]
[Team section]
```

**Function details**
- Data: Static content.
- Validation: None.
- Normal case: Information rendered successfully.
- Abnormal case: No business-specific abnormal behavior.

### 3.2.10 Policy Screen (`/policy`)
**Function trigger**
- Accessed from footer/menu.

**Function description**
- Actor: Public user.
- Purpose: Display terms and policy content.
- Interface: Read-only policy sections.

**Screen layout**
```text
[Policy title]
[Section 1..5]
[Updated date]
```

**Function details**
- Data: Static legal content.
- Validation: None.
- Normal case: Policy content displayed.
- Abnormal case: No business-specific abnormal behavior.

---

## 3.3 Admin Features

### 3.3.1 Admin Dashboard (`/admin`)
**Function trigger**
- Accessed after admin login or from admin sidebar.

**Function description**
- Actor: Admin.
- Purpose: Display financial and system KPI overview.
- Interface: Metric cards and chart/progress widgets.

**Screen layout**
```text
[Admin header]
[KPI cards x4]
[User distribution]
[Wallet and top-up summary]
```

**Function details**
- Data: Financial overview APIs.
- Validation: Guard against divide-by-zero in percentage calculations.
- Normal case: KPI data loaded and displayed.
- Abnormal case: API failure, show error/placeholder state.

### 3.3.2 Manage Users (`/admin/users`)
**Function trigger**
- Accessed from sidebar -> Users.

**Function description**
- Actor: Admin.
- Purpose: Manage users with CRUD, ban/unban, and role updates.
- Interface: Filter bar, table, action menu, and modals.

**Screen layout**
```text
[Search][Role filter][Status][Date range]
[Users table + pagination]
[Row actions: View/Edit/Ban/Delete/Change role]
[Create/Edit modals]
```

**Function details**
- Data: User list and role list.
- Validation: Required form fields for create/edit actions.
- Business rules: Delete action requires confirmation, bulk actions supported.
- Normal case: Updates succeed and list refreshes.
- Abnormal case: API failure, show toast and preserve current UI state.

### 3.3.3 Manage Orders (`/admin/orders`)
**Function trigger**
- Accessed from sidebar -> Orders.

**Function description**
- Actor: Admin.
- Purpose: Monitor orders and payment status.
- Interface: Filter bar, order table, pagination.

**Screen layout**
```text
[Teacher filter][Status][Payment method][Date]
[Orders table]
[Pagination]
```

**Function details**
- Data: Order list.
- Validation: Date range must be valid.
- Business rules: Status mapping (processing/completed/cancelled).
- Normal case: Filters return correct dataset.
- Abnormal case: Query failure, show error.

### 3.3.4 Manage Wallets (`/admin/wallets`)
**Function trigger**
- Accessed from sidebar -> Wallets.

**Function description**
- Actor: Admin.
- Purpose: View user wallets and balances.
- Interface: Wallet table with pagination.

**Screen layout**
```text
[Wallet table: ID/User/Email/Balance/Updated]
[Pagination]
```

**Function details**
- Data: Wallet list.
- Validation: Currency formatting in VND.
- Normal case: Wallet list displayed.
- Abnormal case: Fetch failure, show error state.

### 3.3.5 Wallet Detail (`/admin/wallets/[id]`)
**Function trigger**
- Accessed by selecting a wallet from wallet list.

**Function description**
- Actor: Admin.
- Purpose: View wallet detail and transaction history.
- Interface: Wallet information card and transaction table.

**Screen layout**
```text
[Wallet info card]
[Transaction history table]
[Filters/Pagination]
```

**Function details**
- Data: Wallet by id and wallet transactions.
- Validation: Route id must be valid.
- Normal case: Full transaction history shown.
- Abnormal case: Invalid/non-existing id, show 404/error message.

### 3.3.6 Manage Packages (`/admin/packages`)
**Function trigger**
- Accessed from sidebar -> Packages.

**Function description**
- Actor: Admin.
- Purpose: CRUD subscription packages.
- Interface: Package table and create/edit modal.

**Screen layout**
```text
[Create package button]
[Plan table + actions]
[Create/Edit modal]
```

**Function details**
- Data: Package fields (name, price, duration, quotas, active).
- Validation: Name minimum length 5, valid numeric quota/price values.
- Business rules: Maximum quota may be treated as unlimited.
- Normal case: CRUD succeeds and list refreshes.
- Abnormal case: Duplicate/invalid inputs, show errors.

### 3.3.7 Manage Transactions (`/admin/transactions`)
**Function trigger**
- Accessed from sidebar -> Transactions.

**Function description**
- Actor: Admin.
- Purpose: Monitor wallet transactions across the system.
- Interface: Filter bar, transaction table, pagination.

**Screen layout**
```text
[UserId][Type][Status][Date range]
[Transactions table]
[Pagination]
```

**Function details**
- Data: Transaction list.
- Validation: Convert/filter userId and status with correct types.
- Business rules: Status labels and amount formatting in VND.
- Normal case: Filtering returns expected records.
- Abnormal case: Backend error, display error message.

### 3.3.8 Manage Curriculum (`/admin/curriculum`)
**Function trigger**
- Accessed from sidebar -> Curriculum.

**Function description**
- Actor: Admin.
- Purpose: CRUD Grade/Subject/Lesson metadata.
- Interface: Type tabs, inline forms, and table actions.

**Screen layout**
```text
[Tabs: Grade | Subject | Lesson]
[Inline create/edit form]
[Table + actions]
[Delete confirmation input]
```

**Function details**
- Data: Grades, subjects, lessons.
- Validation: Code/name required, lesson must be mapped to a subject.
- Business rules: Delete operation requires confirmation text.
- Normal case: Create/update/delete succeeds and data reloads.
- Abnormal case: Data conflict/API failure, show error toast.

### 3.3.9 Admin Loading State (`/admin/loading`)
**Function trigger**
- Triggered automatically while admin routes are loading/fetching data.

**Function description**
- Actor: Admin.
- Purpose: Provide loading UX while data is not ready.

**Screen layout**
```text
[Loading skeleton/spinner]
```

**Function details**
- Business rules: Prevent data actions while loading.
- Abnormal case: If loading is too long, optional timeout notice can be shown.

### 3.3.10 Admin Error State (`/admin/error`)
**Function trigger**
- Activated when an admin route throws an error.

**Function description**
- Actor: Admin.
- Purpose: Show failure details and provide recovery actions.

**Screen layout**
```text
[Error message]
[Retry button]
[Back to dashboard]
```

**Function details**
- Normal case: Retry action reloads route/data.
- Abnormal case: Repeated failure keeps user in safe fallback state.

---

## 3.4 Expert Features

### 3.4.1 Expert Dashboard (`/expert`)
**Function trigger**
- Accessed after expert login or via sidebar.

**Function description**
- Actor: Expert.
- Purpose: View overview of certifications/materials in pending/approved states.
- Interface: Welcome banner, statistic cards, recent items.

**Screen layout**
```text
[Welcome + quick actions]
[Stats cards]
[Recent verifications]
[Recent materials]
```

**Function details**
- Data: Verification and material queries.
- Validation: Metrics are calculated from actual datasets.
- Normal case: Correct summary and recent data shown.
- Abnormal case: Query failure, show empty/error fallback.

### 3.4.2 Expert Material Management (`/expert/material`)
**Function trigger**
- Accessed from dashboard/sidebar.

**Function description**
- Actor: Expert.
- Purpose: Upload, update, delete materials and track review status.
- Interface: Upload form, list/grid toggle, detail/edit modal.

**Screen layout**
```text
[Upload material form]
[Search + view toggle]
[Material cards/list]
[Detail/Edit modal]
```

**Function details**
- Data: Title, description, subject, grade, type, price, files.
- Validation: Required fields, file type/size, valid price.
- Business rules: Status map 0/1/2 (pending/approved/rejected).
- Normal case: Upload/update/delete succeeds.
- Abnormal case: GCS resolution or upload failure, show error and allow retry.

### 3.4.3 Expert Certificate Redirect (`/expert/certificate`)
**Function trigger**
- Accessed from expert sidebar certificate item.

**Function description**
- Actor: Expert.
- Purpose: Redirect to certificate tab in profile page.
- Interface: No dedicated business UI, redirect only.

**Screen layout**
```text
[Auto redirect -> /profile?tab=certificate]
```

**Function details**
- Business rules: Centralize certificate management in profile module.
- Abnormal case: If redirect fails, show fallback link.

---

## 3.5 Staff Features

### 3.5.1 Staff Dashboard (`/staff`)
**Function trigger**
- Accessed after staff login or via sidebar.

**Function description**
- Actor: Staff reviewer.
- Purpose: View pending review counters and quick actions.
- Interface: Summary cards and navigation action cards.

**Screen layout**
```text
[Header]
[Pending verification card]
[Pending material card]
[Action cards -> verifications/materials]
```

**Function details**
- Data: Pending verifications and pending materials.
- Validation: Badge visible only when count > 0.
- Normal case: Click action card and navigate to review page.
- Abnormal case: Query failure, show 0 and error notice.

### 3.5.2 Staff Verification Review (`/staff/verifications`)
**Function trigger**
- Accessed from staff dashboard action card.

**Function description**
- Actor: Staff reviewer.
- Purpose: Review expert verification submissions.
- Interface: Pending list, file preview area, approve/reject actions.

**Screen layout**
```text
[Verification list]
[File preview area]
[Approve][Reject]
[Reject reason input]
```

**Function details**
- Data: Verification detail and file metadata.
- Validation: Reject action requires a reason.
- Business rules: Approve/reject updates status immediately.
- Normal case: Review succeeds and item is removed from pending list.
- Abnormal case: File preview fails, allow download; API failure shows error.

### 3.5.3 Staff Material Review (`/staff/materials`)
**Function trigger**
- Accessed from staff dashboard action card.

**Function description**
- Actor: Staff reviewer.
- Purpose: Review educational materials uploaded by experts.
- Interface: Pending list, preview panel, metadata section, actions.

**Screen layout**
```text
[Pending material list]
[Preview pane]
[Metadata section]
[Approve][Reject + reason]
```

**Function details**
- Data: Material review detail and resolved preview URL.
- Validation: Reject reason is required.
- Business rules: Status map pending/approved/rejected.
- Normal case: Review succeeds and queue refreshes.
- Abnormal case: Preview URL failure uses fallback open/download; mutation failure shows error.

---

## 3.6 Teacher Features

### 3.6.1 Teacher Dashboard (`/teacher`)
**Function trigger**
- Accessed after teacher login or via sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Show projects/slides/videos overview and quick actions.
- Interface: Statistics cards, shortcuts to material-lib/slides/videos, recent projects.

**Screen layout**
```text
[Welcome + quick actions]
[Stats cards x4]
[Library cards x3]
[Recent projects]
```

**Function details**
- Data: Projects, products, videos.
- Validation: Create-project modal requires subject and grade.
- Business rules: Current-month metrics calculated from createdAt.
- Normal case: Shortcut navigation works correctly.
- Abnormal case: Query failure, show zero/fallback values.

### 3.6.2 Teacher Projects (`/teacher/projects`)
**Function trigger**
- Accessed from dashboard/sidebar, supports subject/grade query params.

**Function description**
- Actor: Teacher.
- Purpose: Manage project list (create/edit/delete/open).
- Interface: Search, folder grouping by subject-grade, grid/list, modals.

**Screen layout**
```text
[Search + View toggle + Create]
[Subject/Grade folders]
[Project list/cards]
[Create/Edit/Delete modals]
```

**Function details**
- Data: Project list and subject/grade metadata.
- Validation: Create requires project name, subject, and grade.
- Business rules: Pagination size and filter behavior by search/options.
- Normal case: Open project navigates to /teacher/[id].
- Abnormal case: API failure, show error while keeping previous list state.

### 3.6.3 Teacher Project Detail (`/teacher/[id]`)
**Function trigger**
- Accessed when selecting a project from project list.

**Function description**
- Actor: Teacher.
- Purpose: Manage input documents, products (slides), videos, and run pipeline.
- Interface: Sections/tabs for documents-products-videos with pipeline modal.

**Screen layout**
```text
[Project header]
[Input documents section]
[Products section]
[Videos section]
[Pipeline progress modal]
```

**Function details**
- Data: Project detail, input documents, products, videos, task progress.
- Validation: Project code/id must be valid.
- Business rules: 3-step pipeline Analysis -> Slides -> Video.
- Normal case: Slide/video generation succeeds, progress updates in real time via hub.
- Abnormal case: Task failure details shown in progress modal with retry option.

### 3.6.4 Slide Editor (`/teacher/editor`)
**Function trigger**
- Accessed from project detail, slides library, or slide generation flow.

**Function description**
- Actor: Teacher.
- Purpose: Edit slides with drag-drop card/layout/block model.
- Interface: Left sidebar, top toolbar, main stage, right material panel.

**Screen layout**
```text
[Toolbar]
[Sidebar slides] [Main stage canvas] [Material sidebar]
[Presentation overlay (optional)]
```

**Function details**
- Data: Document state in Zustand store.
- Validation: Drag/drop target must be valid (card/layout column).
- Business rules: Active card is the edit target; editing is in-memory.
- Normal case: Reorder cards/blocks, add blocks, insert materials/templates.
- Abnormal case: Invalid drop action is ignored and state remains consistent.

### 3.6.5 Editor Loading State (`/teacher/editor/loading`)
**Function trigger**
- Triggered automatically while editor data is loading.

**Function description**
- Actor: Teacher.
- Purpose: Show loading skeleton/spinner for continuous UX.

**Screen layout**
```text
[Editor loading placeholder]
```

**Function details**
- Business rules: Editing actions are temporarily blocked until data is ready.

### 3.6.6 Editor Error State (`/teacher/editor/error`)
**Function trigger**
- Activated when editor route throws an error.

**Function description**
- Actor: Teacher.
- Purpose: Show error details and provide retry/back actions.

**Screen layout**
```text
[Error message]
[Retry]
[Back to project]
```

**Function details**
- Normal case: Retry reloads editor route/data.
- Abnormal case: If issue persists, user is guided back to project list.

### 3.6.7 Teacher Videos (`/teacher/videos`)
**Function trigger**
- Accessed from dashboard/sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Manage generated videos.
- Interface: Search, list/grid view, pagination, player modal.

**Screen layout**
```text
[Search]
[Video cards/list]
[Pagination]
[Video player modal]
```

**Function details**
- Data: Completed videos, mapped with project/product information.
- Validation: Only completed videos are displayed.
- Business rules: Pagination resets when search keyword changes.
- Normal case: Click video to open preview modal.
- Abnormal case: Fetch failure, show error toast.

### 3.6.8 Teacher Material Library (`/teacher/material-lib`)
**Function trigger**
- Accessed from dashboard card or sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Browse materials by subject/grade and continue into project flow.
- Interface: Filters and grid/list of materials/projects.

**Screen layout**
```text
[Subject filter][Grade filter]
[View toggle]
[Material/Project cards]
```

**Function details**
- Data: Subjects, grades, projects/materials.
- Validation: Filter values must be valid.
- Normal case: Selecting an item opens project/editor flow.
- Abnormal case: Empty state when no matching data.

### 3.6.9 Teacher Slides Library (`/teacher/slides`)
**Function trigger**
- Accessed from dashboard card or sidebar.

**Function description**
- Actor: Teacher.
- Purpose: View and quickly open slide decks for editing.
- Interface: Search, cards, open/edit action, pagination.

**Screen layout**
```text
[Search]
[Slide cards]
[Open/Edit action]
[Pagination]
```

**Function details**
- Data: Products containing slide/editedSlide.
- Validation: Use edited slide as priority source if available.
- Business rules: Document is loaded into store before editor navigation.
- Normal case: Open action navigates to /teacher/editor successfully.
- Abnormal case: Slide fetch failure, show error.

### 3.6.10 Teacher Game Maker (`/teacher/game-maker`)
**Function trigger**
- Accessed from teacher game workflow or direct route.

**Function description**
- Actor: Teacher.
- Purpose: Run educational game demos/interactions using keyboard input.
- Interface: Game type buttons, canvas area, runtime status.

**Screen layout**
```text
[Game type buttons]
[Canvas]
[Status text]
[Stop button]
```

**Function details**
- Data: Playable payload for game engine.
- Validation: Selected game type must be valid.
- Business rules: Existing engine instance must be disposed before starting another.
- Normal case: Game starts, updates status, and finishes normally.
- Abnormal case: Engine import/init failure, show error.

### 3.6.11 Teacher Pipeline (`/teacher/pipeline`)
**Function trigger**
- Accessed from project detail when starting pipeline.

**Function description**
- Actor: Teacher.
- Purpose: Orchestrate 3-step lesson generation: analysis, slides, and video.
- Interface: Stepper, step content panel, real-time progress modal.

**Screen layout**
```text
[Step indicator: Analysis > Slides > Video]
[Step content panel]
[Progress modal]
[Back/Next actions]
```

**Function details**
- Data: taskId/status, evaluation output, slide document, video result.
- Validation: Next step is blocked until current step succeeds.
- Business rules: Task state is persisted for recovery after refresh.
- Normal case: Step succeeds and moves to next step.
- Abnormal case: Step failure shows details and supports retry/cancel.

---

## 3.7 Shared and Misc Features

### 3.7.1 Profile Screen (`/profile`)
**Function trigger**
- Accessed from user avatar/menu or direct route.

**Function description**
- Actor: Authenticated user (teacher/expert/staff).
- Purpose: Manage profile, security, payment, and certificate (role-dependent).
- Interface: Tabbed layout by role.

**Screen layout**
```text
[Tabs: Profile | Security | Payment* | Certificate*]
[Tab content forms/lists]
```

**Function details**
- Data: Me profile, wallet, transactions, plans, verifications.
- Validation: Strong password policy; avatar/file upload type-size checks.
- Business rules: Payment tab hidden for staff; certificate tab enabled for expert.
- Normal case: Updates succeed, show toast, refresh data.
- Abnormal case: Upload/payment/verification failures show clear errors.

### 3.7.2 Material Shop (`/material-shop`)
**Function trigger**
- Accessed from menu/sidebar or direct route.

**Function description**
- Actor: Authenticated user (primarily teacher).
- Purpose: Browse, filter, and purchase expert materials.
- Interface: Filters, list/grid view, detail modal, purchase confirmation.

**Screen layout**
```text
[Search][Subject][Grade][Type]
[Material cards/list]
[Detail modal]
[Buy confirmation modal]
```

**Function details**
- Data: Browse materials, purchased set, wallet information.
- Validation: User must be logged in and have sufficient balance.
- Business rules: Purchased items show owned state; free items are immediately claimable.
- Normal case: Purchase succeeds and purchased list updates.
- Abnormal case: Insufficient balance/API failure, show error.

### 3.7.3 Game Demo (`/game-demo`)
**Function trigger**
- Accessed when user opens demo route.

**Function description**
- Actor: Public/authenticated user.
- Purpose: Demonstrate 4 mini games using keyboard input.
- Interface: Game buttons, canvas, status text.

**Screen layout**
```text
[4 game buttons]
[Canvas demo]
[Status + Stop]
```

**Function details**
- Data: Mock playable data.
- Validation: Canvas must keep focus for keyboard input.
- Business rules: Only one active engine instance at a time.
- Normal case: Game runs and finishes.
- Abnormal case: Runtime error stops engine and displays message.

### 3.7.4 Test Screen (`/Test`)
**Function trigger**
- Accessed by developers/QA through test route.

**Function description**
- Actor: Developer/internal QA.
- Purpose: Quick editor testing with mock slide data.
- Interface: Same shell as editor (sidebar, toolbar, stage, material panel).

**Screen layout**
```text
[Toolbar]
[Sidebar] [MainStage] [MaterialSidebar]
```

**Function details**
- Data: Static mock slide data.
- Validation: No complex auth/business validation.
- Business rules: Test-only route, not intended for production end users.
- Normal case: Mock data loads and drag-drop behaviors can be tested.
- Abnormal case: Invalid mock data shows fallback error.

---

## 3.8 Route State and Scaffold Screens

### 3.8.1 Root Layout (`/layout`)
**Function trigger**
- Activated automatically for all app routes.

**Function description**
- Purpose: Global wrapper (providers, global CSS, shared shell).

**Function details**
- Business rules: Must render route children correctly.

### 3.8.2 Admin Layout (`/admin/layout`), Expert Layout (`/expert/layout`), Staff Layout (`/staff/layout`), Teacher Layout (`/teacher/layout`)
**Function trigger**
- Activated automatically when entering corresponding role routes.

**Function description**
- Purpose: Role-specific shell (sidebar/header/auth guard).

**Function details**
- Business rules: Invalid role should redirect/deny access and render correct role navigation.

---

## 3.9 Submission Checklist

- Cover all route screens in `src/app`.
- Ensure each function includes 4 parts: Trigger, Description, Layout, Details.
- Include both normal and abnormal cases.
- Separate important loading/error states.
- Include layout/state scaffold screens for complete flow understanding.
