# 3. Functional Specification - All Screens

Tai lieu nay mo ta toan bo screen trong he thong theo format:
- Function trigger
- Function description
- Screen layout (wireframe text)
- Function details (data, validation, business rules, normal/abnormal)

---

## 3.2 Public & Authentication Features

### 3.2.1 Home Screen (`/`)
**Function trigger**
- Trigger khi user truy cap domain goc hoac dieu huong ve trang chu.
- Navigation: direct URL, logo click, sau mot so flow auth.

**Function description**
- Actor: Public user.
- Purpose: Gioi thieu EduVi, dieu huong den dang ky/bao gia.
- Interface: Hero, feature cards, CTA buttons, testimonials/FAQ.

**Screen layout**
```text
[Header]
[Hero + CTA: Bat dau mien phi | Xem bang gia]
[Feature grid]
[FAQ/Testimonial]
[Footer]
```

**Function details**
- Data: chu yeu static, co hydrate auth state de xac dinh redirect.
- Validation: khong co form input.
- Normal: user click CTA -> den register/subscription.
- Abnormal: auth state loi -> van render trang static.

### 3.2.2 Login Screen (`/login`)
**Function trigger**
- Tu Home, Register, Forgot Password, hoac truy cap truc tiep.

**Function description**
- Actor: Public user.
- Purpose: Dang nhap bang username/password hoac Google.
- Interface: Form dang nhap, show/hide password, link quen mat khau.

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
- Data: username, password; token response tu auth API.
- Validation: bat buoc nhap username/password.
- Business rules: redirect theo role (admin/teacher/expert/staff).
- Normal: login thanh cong -> luu token -> redirect role home.
- Abnormal: sai thong tin / API fail -> hien error toast/message.

### 3.2.3 Register Screen (`/register`)
**Function trigger**
- Tu Home CTA hoac link dang ky.

**Function description**
- Actor: Public user.
- Purpose: Tao tai khoan va chon role.
- Interface: Form profile + role selector.

**Screen layout**
```text
[Register title]
[Username][Email][Full name][Phone]
[Password][Confirm password]
[Role selector: Expert/Teacher]
[Submit]
```

**Function details**
- Data: register payload + roleId.
- Validation: username 3-50, password strong, confirm khop.
- Business rules: role hop le theo enum he thong.
- Normal: register success -> sang Verify OTP.
- Abnormal: email ton tai / regex fail -> chan submit, hien loi.

### 3.2.4 Verify OTP Screen (`/verify-otp`)
**Function trigger**
- Sau register thanh cong hoac flow can xac thuc OTP.

**Function description**
- Actor: User vua dang ky.
- Purpose: Xac thuc OTP 6 so.
- Interface: 6 o OTP, timer resend.

**Screen layout**
```text
[OTP title]
[_][_][_][_][_][_]
[Countdown + Resend]
[Verify button]
```

**Function details**
- Data: userId/email + otp.
- Validation: chi cho phep so, du 6 ky tu moi submit.
- Business rules: resend khoa khi timer > 0.
- Normal: verify success -> redirect Login.
- Abnormal: OTP sai/het han -> thong bao loi, cho nhap lai.

### 3.2.5 Forgot Password Screen (`/forgot-password`)
**Function trigger**
- Tu Login qua link Quen mat khau.

**Function description**
- Actor: User quen mat khau.
- Purpose: Gui OTP reset qua email.
- Interface: email input + send button.

**Screen layout**
```text
[Forgot password title]
[Email input]
[Send OTP button]
```

**Function details**
- Data: email.
- Validation: email required, format hop le.
- Normal: gui OTP success -> sang Reset Password.
- Abnormal: email khong ton tai / API fail -> hien loi.

### 3.2.6 Reset Password Screen (`/reset-password`)
**Function trigger**
- Sau forgot-password gui OTP thanh cong.

**Function description**
- Actor: User reset password.
- Purpose: Nhap OTP + mat khau moi.
- Interface: OTP 6 so + new password + confirm.

**Screen layout**
```text
[Reset password title]
[OTP 6 o]
[New password]
[Confirm password]
[Reset button]
```

**Function details**
- Data: email/user + otp + newPassword.
- Validation: password strong, confirm match, OTP du 6 so.
- Business rules: timer resend OTP tuong tu verify.
- Normal: reset success -> ve Login.
- Abnormal: OTP sai/het han, password yeu -> bao loi.

### 3.2.7 Subscription Screen (`/subscription`)
**Function trigger**
- Tu Home CTA hoac menu.

**Function description**
- Actor: Public/Auth user (staff khong mua).
- Purpose: Xem va mua goi subscription.
- Interface: cards goi cuoc, nut mua.

**Screen layout**
```text
[Pricing hero]
[Plan card 1][Plan card 2][Plan card 3]
[Buy buttons]
```

**Function details**
- Data: danh sach plans, wallet balance.
- Validation: can dang nhap de mua.
- Business rules: staff redirect staff dashboard.
- Normal: mua thanh cong -> cong quota, thong bao.
- Abnormal: thieu so du / API fail -> thong bao loi.

### 3.2.8 Contact Screen (`/contact`)
**Function trigger**
- Tu footer/menu hoac URL truc tiep.

**Function description**
- Actor: Public user.
- Purpose: Gui lien he support.
- Interface: contact info + form lien he.

**Screen layout**
```text
[Contact info]
[Name][Email][Subject]
[Message textarea]
[Send button]
```

**Function details**
- Data: name, email, subject, message.
- Validation: name/email/message required.
- Normal: gui thanh cong -> reset form.
- Abnormal: loi gui -> hien error.

### 3.2.9 About Screen (`/about`)
**Function trigger**
- Tu menu/footer.

**Function description**
- Actor: Public user.
- Purpose: Gioi thieu mission, vision, core values.
- Interface: static sections.

**Screen layout**
```text
[About hero]
[Mission/Vision]
[Core values grid]
[Team section]
```

**Function details**
- Data: static content.
- Validation: khong co.
- Normal: render thong tin.
- Abnormal: khong co abnormal logic nghiep vu.

### 3.2.10 Policy Screen (`/policy`)
**Function trigger**
- Tu footer/menu.

**Function description**
- Actor: Public user.
- Purpose: Hien thi chinh sach va dieu khoan.
- Interface: cac section chinh sach read-only.

**Screen layout**
```text
[Policy title]
[Section 1..5]
[Updated date]
```

**Function details**
- Data: static legal content.
- Validation: khong co.
- Normal: doc thong tin.
- Abnormal: khong co.

---

## 3.3 Admin Features

### 3.3.1 Admin Dashboard (`/admin`)
**Function trigger**
- Sau login role Admin hoac tu sidebar.

**Function description**
- Actor: Admin.
- Purpose: Tong quan KPI tai chinh/he thong.
- Interface: metric cards + chart/progress info.

**Screen layout**
```text
[Admin header]
[KPI cards x4]
[User distribution]
[Wallet & topup summary]
```

**Function details**
- Data: financial overview API.
- Validation: guard divide-by-zero khi tinh ty le.
- Normal: load KPI thanh cong.
- Abnormal: API fail -> hien error/placeholder.

### 3.3.2 Manage Users (`/admin/users`)
**Function trigger**
- Sidebar -> Users.

**Function description**
- Actor: Admin.
- Purpose: Quan ly user CRUD + ban/unban + role.
- Interface: filter bar, table, action menu, modals.

**Screen layout**
```text
[Search][Role filter][Status][Date range]
[Users table + pagination]
[Row actions: View/Edit/Ban/Delete/Change role]
[Create/Edit modals]
```

**Function details**
- Data: users list, roles list.
- Validation: create/edit fields required theo form.
- Business rules: delete co confirm, bulk action ho tro.
- Normal: cap nhat thanh cong -> refresh list.
- Abnormal: API fail -> show toast, giu state hien tai.

### 3.3.3 Manage Orders (`/admin/orders`)
**Function trigger**
- Sidebar -> Orders.

**Function description**
- Actor: Admin.
- Purpose: Theo doi don hang va payment status.
- Interface: filter + table + pagination.

**Screen layout**
```text
[Teacher filter][Status][Payment method][Date]
[Orders table]
[Pagination]
```

**Function details**
- Data: orders list.
- Validation: date range hop le.
- Business rules: status map (processing/completed/cancelled).
- Normal: filter dung -> tra ve dung dataset.
- Abnormal: loi query -> thong bao loi.

### 3.3.4 Manage Wallets (`/admin/wallets`)
**Function trigger**
- Sidebar -> Wallets.

**Function description**
- Actor: Admin.
- Purpose: Xem vi user va so du.
- Interface: table wallets + pagination.

**Screen layout**
```text
[Wallet table: ID/User/Email/Balance/Updated]
[Pagination]
```

**Function details**
- Data: wallets list.
- Validation: format currency VND.
- Normal: hien thi danh sach vi.
- Abnormal: fetch fail -> hien error state.

### 3.3.5 Wallet Detail (`/admin/wallets/[id]`)
**Function trigger**
- Tu danh sach wallets click vao mot wallet.

**Function description**
- Actor: Admin.
- Purpose: Xem chi tiet vi va lich su giao dich.
- Interface: wallet header + transaction list.

**Screen layout**
```text
[Wallet info card]
[Transaction history table]
[Filters/Pagination]
```

**Function details**
- Data: wallet by id + transactions.
- Validation: id route phai hop le.
- Normal: hien lich su day du.
- Abnormal: id khong ton tai -> 404/error message.

### 3.3.6 Manage Packages (`/admin/packages`)
**Function trigger**
- Sidebar -> Packages.

**Function description**
- Actor: Admin.
- Purpose: CRUD goi subscription.
- Interface: plan table + create/edit modal.

**Screen layout**
```text
[Create package button]
[Plan table + actions]
[Create/Edit modal]
```

**Function details**
- Data: plan fields (name, price, duration, quotas, active).
- Validation: ten toi thieu 5 ky tu, quota/gia tri hop le.
- Business rules: max quota co the xem la unlimited.
- Normal: CRUD thanh cong -> refresh list.
- Abnormal: duplicate/invalid input -> bao loi.

### 3.3.7 Manage Transactions (`/admin/transactions`)
**Function trigger**
- Sidebar -> Transactions.

**Function description**
- Actor: Admin.
- Purpose: Theo doi giao dich vi toan he thong.
- Interface: filter bar + table + pagination.

**Screen layout**
```text
[UserId][Type][Status][Date range]
[Transactions table]
[Pagination]
```

**Function details**
- Data: transaction list.
- Validation: convert userId/status dung kieu.
- Business rules: status labels va amount format VND.
- Normal: loc du lieu theo bo loc.
- Abnormal: backend error -> thong bao loi.

### 3.3.8 Manage Curriculum (`/admin/curriculum`)
**Function trigger**
- Sidebar -> Curriculum.

**Function description**
- Actor: Admin.
- Purpose: CRUD Grade/Subject/Lesson.
- Interface: tab theo loai du lieu + form + table.

**Screen layout**
```text
[Tabs: Grade | Subject | Lesson]
[Inline create/edit form]
[Table + actions]
[Delete confirm input]
```

**Function details**
- Data: grades, subjects, lessons.
- Validation: code/name required, lesson phai gan subject.
- Business rules: xoa can confirm text.
- Normal: tao/sua/xoa xong reload data.
- Abnormal: conflict data, loi API -> toast error.

### 3.3.9 Admin Loading State (`/admin/loading`)
**Function trigger**
- Tu dong khi route admin dang fetch/chuyen trang.

**Function description**
- Actor: Admin.
- Purpose: Hien loading UX trong luc data chua san sang.

**Screen layout**
```text
[Loading skeleton/spinner]
```

**Function details**
- Business rule: khong cho user thao tac data khi dang loading.
- Abnormal: neu loading qua lau -> co the kem thong bao timeout.

### 3.3.10 Admin Error State (`/admin/error`)
**Function trigger**
- Kich hoat khi route admin throw error.

**Function description**
- Actor: Admin.
- Purpose: Hien thong bao loi va hanh dong retry/back.

**Screen layout**
```text
[Error message]
[Retry button]
[Back dashboard]
```

**Function details**
- Normal: user retry va tai lai du lieu.
- Abnormal: loi lap lai -> giu user o trang an toan.

---

## 3.4 Expert Features

### 3.4.1 Expert Dashboard (`/expert`)
**Function trigger**
- Sau login role Expert hoac sidebar.

**Function description**
- Actor: Expert.
- Purpose: Tong quan certification/material pending & approved.
- Interface: welcome banner, stats cards, recent items.

**Screen layout**
```text
[Welcome + quick actions]
[Stats cards]
[Recent verifications]
[Recent materials]
```

**Function details**
- Data: verifications + my materials queries.
- Validation: tinh toan so lieu tu dataset thuc te.
- Normal: hien dung thong ke.
- Abnormal: query fail -> fallback empty/error.

### 3.4.2 Expert Material Management (`/expert/material`)
**Function trigger**
- Tu dashboard/sidebar.

**Function description**
- Actor: Expert.
- Purpose: Upload, edit, delete hoc lieu; theo doi duyet.
- Interface: upload form, list/grid toggle, detail/edit modal.

**Screen layout**
```text
[Upload material form]
[Search + view toggle]
[Material cards/list]
[Detail/Edit modal]
```

**Function details**
- Data: title, desc, subject, grade, type, price, files.
- Validation: required fields, file type/size, price hop le.
- Business rules: status 0/1/2 (pending/approved/rejected).
- Normal: upload/sua/xoa thanh cong.
- Abnormal: GCS resolve loi, upload fail -> bao loi + retry.

### 3.4.3 Expert Certificate Redirect (`/expert/certificate`)
**Function trigger**
- Tu sidebar expert certificate.

**Function description**
- Actor: Expert.
- Purpose: Dieu huong den Profile tab certificate.
- Interface: khong co giao dien nghiep vu rieng, chi redirect.

**Screen layout**
```text
[Auto redirect -> /profile?tab=certificate]
```

**Function details**
- Business rules: giu mot diem quan ly chung trong Profile.
- Abnormal: neu redirect fail -> hien link fallback.

---

## 3.5 Staff Features

### 3.5.1 Staff Dashboard (`/staff`)
**Function trigger**
- Sau login role Staff hoac sidebar.

**Function description**
- Actor: Staff reviewer.
- Purpose: Tong quan so item pending can duyet.
- Interface: summary cards + quick navigation cards.

**Screen layout**
```text
[Header]
[Pending verification card]
[Pending material card]
[Action cards -> verifications/materials]
```

**Function details**
- Data: pending verifications + pending materials.
- Validation: badge hien khi count > 0.
- Normal: click card -> den trang duyet tuong ung.
- Abnormal: query fail -> hien 0 + thong bao loi.

### 3.5.2 Staff Verification Review (`/staff/verifications`)
**Function trigger**
- Tu staff dashboard action card.

**Function description**
- Actor: Staff reviewer.
- Purpose: Duyet ho so xac minh expert.
- Interface: pending list, file preview, approve/reject actions.

**Screen layout**
```text
[Verification list]
[File preview area]
[Approve][Reject]
[Reject reason input]
```

**Function details**
- Data: verification detail + file metadata.
- Validation: reject bat buoc nhap ly do.
- Business rules: approve/reject cap nhat ngay status.
- Normal: duyet thanh cong -> item roi khoi pending list.
- Abnormal: file khong preview duoc -> cho download; API fail -> bao loi.

### 3.5.3 Staff Material Review (`/staff/materials`)
**Function trigger**
- Tu staff dashboard action card.

**Function description**
- Actor: Staff reviewer.
- Purpose: Duyet hoc lieu do expert upload.
- Interface: list pending, preview image/video/doc, actions.

**Screen layout**
```text
[Pending material list]
[Preview pane]
[Metadata section]
[Approve][Reject + reason]
```

**Function details**
- Data: material review detail + resolved preview URL.
- Validation: reject reason required.
- Business rules: status map pending/approved/rejected.
- Normal: xu ly thanh cong -> refresh pending queue.
- Abnormal: preview URL loi -> fallback open/download; mutation fail -> show error.

---

## 3.6 Teacher Features

### 3.6.1 Teacher Dashboard (`/teacher`)
**Function trigger**
- Sau login role Teacher hoac sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Tong quan du an/slide/video va quick actions.
- Interface: stats cards, links den material-lib/slides/videos, recent projects.

**Screen layout**
```text
[Welcome + quick actions]
[Stats cards x4]
[Library cards x3]
[Recent projects]
```

**Function details**
- Data: projects, products, videos.
- Validation: create project modal yeu cau subject + grade.
- Business rules: thong ke this-month theo createdAt.
- Normal: click shortcut -> den dung module.
- Abnormal: query fail -> hien so lieu 0/fallback.

### 3.6.2 Teacher Projects (`/teacher/projects`)
**Function trigger**
- Tu dashboard/sidebar; ho tro query params subject/grade.

**Function description**
- Actor: Teacher.
- Purpose: Quan ly danh sach du an (create/edit/delete/open).
- Interface: search, folder view theo subject-grade, grid/list, modals.

**Screen layout**
```text
[Search + View toggle + Create]
[Subject/Grade folders]
[Project list/cards]
[Create/Edit/Delete modals]
```

**Function details**
- Data: projects + metadata subjects/grades.
- Validation: create can chon subject/grade, ten du an required.
- Business rules: page size, loc theo search va bo loc.
- Normal: open project -> route /teacher/[id].
- Abnormal: API fail -> thong bao loi, giu danh sach cu.

### 3.6.3 Teacher Project Detail (`/teacher/[id]`)
**Function trigger**
- Click 1 project trong Projects.

**Function description**
- Actor: Teacher.
- Purpose: Quan ly input docs, products(slides), videos, va chay pipeline.
- Interface: tabs/sections cho document-product-video + modals pipeline.

**Screen layout**
```text
[Project header]
[Input documents section]
[Products section]
[Videos section]
[Pipeline progress modal]
```

**Function details**
- Data: project detail, input docs, products, videos, task progress.
- Validation: require projectCode hop le.
- Business rules: pipeline 3 buoc Analysis -> Slides -> Video.
- Normal: tao slide/video thanh cong, cap nhat realtime qua hub.
- Abnormal: task fail -> hien loi trong progress modal + cho retry.

### 3.6.4 Slide Editor (`/teacher/editor`)
**Function trigger**
- Tu project detail, slides library, hoac luong tao slide.

**Function description**
- Actor: Teacher.
- Purpose: Chinh sua slide dang drag-drop theo card/layout/block.
- Interface: left sidebar, top toolbar, main stage, right material panel.

**Screen layout**
```text
[Toolbar]
[Sidebar slides] [Main stage canvas] [Material sidebar]
[Presentation overlay (optional)]
```

**Function details**
- Data: document state trong Zustand store.
- Validation: drag/drop target hop le (card/layout column).
- Business rules: active card la card duoc edit; in-memory editing.
- Normal: reorder cards/blocks, add block, insert material/template.
- Abnormal: invalid drop -> bo qua thao tac, khong mutate sai state.

### 3.6.5 Editor Loading State (`/teacher/editor/loading`)
**Function trigger**
- Tu dong hien khi editor dang load data.

**Function description**
- Actor: Teacher.
- Purpose: hien loading skeleton/spinner cho UX lien tuc.

**Screen layout**
```text
[Editor loading placeholder]
```

**Function details**
- Business rules: tam thoi khoa thao tac edit truoc khi data san sang.

### 3.6.6 Editor Error State (`/teacher/editor/error`)
**Function trigger**
- Kich hoat khi editor route throw error.

**Function description**
- Actor: Teacher.
- Purpose: thong bao loi, cho retry/quay lai.

**Screen layout**
```text
[Error message]
[Retry]
[Back to project]
```

**Function details**
- Normal: retry load lai editor.
- Abnormal: neu van loi, huong user quay ve project list.

### 3.6.7 Teacher Videos (`/teacher/videos`)
**Function trigger**
- Tu dashboard/sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Quan ly danh sach video da generate xong.
- Interface: search, list/grid, pagination, player modal.

**Screen layout**
```text
[Search]
[Video cards/list]
[Pagination]
[Video player modal]
```

**Function details**
- Data: videos (status completed), map project/product info.
- Validation: chi hien video completed.
- Business rules: reset page khi doi search.
- Normal: click video -> open preview modal.
- Abnormal: fetch loi -> show error toast.

### 3.6.8 Teacher Material Library (`/teacher/material-lib`)
**Function trigger**
- Tu dashboard card hoac sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Duyet hoc lieu theo subject/grade, tiep tuc vao project.
- Interface: filters, grid/list materials/projects.

**Screen layout**
```text
[Subject filter][Grade filter]
[View toggle]
[Material/Project cards]
```

**Function details**
- Data: subjects, grades, projects/materials.
- Validation: bo loc hop le.
- Normal: chon item -> mo project/editor.
- Abnormal: khong co data -> empty state.

### 3.6.9 Teacher Slides Library (`/teacher/slides`)
**Function trigger**
- Tu dashboard card hoac sidebar.

**Function description**
- Actor: Teacher.
- Purpose: Xem va mo bo slide de edit nhanh.
- Interface: search, cards, pagination.

**Screen layout**
```text
[Search]
[Slide cards]
[Open/Edit action]
[Pagination]
```

**Function details**
- Data: products co slide/editedSlide.
- Validation: chon dung nguon slide (edited uu tien neu co).
- Business rules: load document vao store truoc khi route editor.
- Normal: open thanh cong -> vao /teacher/editor.
- Abnormal: fetch slide fail -> thong bao loi.

### 3.6.10 Teacher Game Maker (`/teacher/game-maker`)
**Function trigger**
- Tu module teacher game flow hoac direct route.

**Function description**
- Actor: Teacher.
- Purpose: Chay game giao duc demo/tuong tac voi keyboard.
- Interface: game type buttons + canvas + status.

**Screen layout**
```text
[Game type buttons]
[Canvas]
[Status text]
[Stop button]
```

**Function details**
- Data: playable payload cho game engine.
- Validation: game type hop le.
- Business rules: dispose engine cu truoc khi start game moi.
- Normal: game start -> update status -> finish.
- Abnormal: import engine fail -> show error.

### 3.6.11 Teacher Pipeline (`/teacher/pipeline`)
**Function trigger**
- Tu project detail khi start pipeline.

**Function description**
- Actor: Teacher.
- Purpose: Orchestrate 3 step tao bai giang: analysis, slides, video.
- Interface: stepper + noi dung tung buoc + progress modal realtime.

**Screen layout**
```text
[Step indicator: Analysis > Slides > Video]
[Step content panel]
[Progress modal]
[Back/Next actions]
```

**Function details**
- Data: taskId/status, evaluation, slide doc, video result.
- Validation: khong nhay qua step khi step truoc chua xong.
- Business rules: luu task state de khoi phuc sau refresh.
- Normal: step success -> sang step tiep.
- Abnormal: step fail -> hien chi tiet loi, cho retry/cancel.

---

## 3.7 Shared & Misc Features

### 3.7.1 Profile Screen (`/profile`)
**Function trigger**
- Tu avatar/menu user hoac direct route.

**Function description**
- Actor: User da dang nhap (teacher/expert/staff).
- Purpose: Quan ly profile, security, payment, certificate (tuy role).
- Interface: tabbed screen theo role.

**Screen layout**
```text
[Tabs: Profile | Security | Payment* | Certificate*]
[Tab content forms/lists]
```

**Function details**
- Data: me profile, wallet, transactions, plans, verifications.
- Validation: change password policy manh; upload avatar/file type-size.
- Business rules: payment tab khong cho staff; certificate tab cho expert.
- Normal: update thanh cong -> toast + refresh data.
- Abnormal: upload/payment/verify fail -> thong bao loi ro rang.

### 3.7.2 Material Shop (`/material-shop`)
**Function trigger**
- Tu menu/sidebar hoac direct route.

**Function description**
- Actor: Auth user (chinh la teacher).
- Purpose: Browse, filter, mua hoc lieu expert.
- Interface: filters, list/grid, detail modal, purchase confirm.

**Screen layout**
```text
[Search][Subject][Grade][Type]
[Material cards/list]
[Detail modal]
[Buy confirm modal]
```

**Function details**
- Data: browse materials, purchased set, wallet info.
- Validation: can dang nhap va du so du de mua.
- Business rules: item da mua hien owned state, item free co the lay ngay.
- Normal: mua thanh cong -> cap nhat purchased list.
- Abnormal: thieu so du/API fail -> thong bao loi.

### 3.7.3 Game Demo (`/game-demo`)
**Function trigger**
- User mo route demo.

**Function description**
- Actor: Public/Auth user.
- Purpose: Demo 4 mini games bang keyboard.
- Interface: game buttons + canvas + status.

**Screen layout**
```text
[4 game buttons]
[Canvas demo]
[Status + Stop]
```

**Function details**
- Data: mock playable data.
- Validation: canvas focus de nhan keyboard input.
- Business rules: chi cho phep 1 engine active tai 1 thoi diem.
- Normal: choi game den finish.
- Abnormal: runtime game loi -> dung game va thong bao.

### 3.7.4 Test Screen (`/Test`)
**Function trigger**
- Dev truy cap route test.

**Function description**
- Actor: Developer/internal QA.
- Purpose: Test nhanh editor voi mock slide data.
- Interface: giong editor (sidebar, toolbar, stage, material panel).

**Screen layout**
```text
[Toolbar]
[Sidebar] [MainStage] [MaterialSidebar]
```

**Function details**
- Data: static slidedata.json.
- Validation: khong co auth/business validation phuc tap.
- Business rules: route test, khong phuc vu end-user production.
- Normal: load mock data va test drag-drop.
- Abnormal: mock data loi -> hien fallback error.

---

## 3.8 Route State/Scaffold Screens

### 3.8.1 Root Layout (`/layout`)
**Function trigger**
- Tu dong cho moi route app.

**Function description**
- Purpose: wrapper tong (providers, global css, shared shell).

**Function details**
- Business rules: phai render dung children route.

### 3.8.2 Admin Layout (`/admin/layout`), Expert Layout (`/expert/layout`), Staff Layout (`/staff/layout`), Teacher Layout (`/teacher/layout`)
**Function trigger**
- Tu dong khi vao route role tuong ung.

**Function description**
- Purpose: role shell (sidebar/header/auth guard).

**Function details**
- Business rules: role sai -> redirect/deny; dung nav theo role.

---

## 3.9 Checklist De Nop Doc

- Da bao phu toan bo screen route trong `src/app`.
- Moi function co du 4 muc: Trigger, Description, Layout, Details.
- Co normal va abnormal cases.
- Co tach rieng loading/error state quan trong.
- Co bo sung layout/state screens de team hinh dung full flow.
