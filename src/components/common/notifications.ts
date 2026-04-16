/**
 * notifications.ts — Centralized notification message strings
 * ============================================================
 * All user-facing notification messages are defined here.
 * Import `MSGS` in any page/component and pass to notify.*().
 *
 * Usage:
 *   import { notify, MSGS } from '@/components/common';
 *   notify.success(MSGS.project.createSuccess('Tên dự án'));
 *   notify.error(MSGS.slide.deleteError);
 */

export const MSGS = {
  // ── Projects ─────────────────────────────────────────────────────────────
  project: {
    createSuccess: (name: string) => `Dự án "${name}" đã được tạo thành công!`,
    createError:   'Tạo dự án thất bại. Vui lòng thử lại.',
    updateSuccess: 'Cập nhật dự án thành công!',
    updateError:   'Cập nhật dự án thất bại. Vui lòng thử lại.',
    deleteSuccess: 'Đã xóa dự án thành công',
    deleteError:   'Xóa dự án thất bại. Vui lòng thử lại.',
  },

  // ── Slides ────────────────────────────────────────────────────────────────
  slide: {
    generateStart:  'Đang tạo slide...',
    generateError:  'Tạo slide thất bại. Vui lòng thử lại.',
    saveSuccess:    'Lưu slide thành công!',
    saveError:      'Lưu slide thất bại. Vui lòng thử lại.',
    openError:      'Không thể mở slide. Vui lòng thử lại.',
    noSlideError:   'Không thể lấy đường dẫn slide. Vui lòng thử lại.',
    deleteSuccess:  'Xóa slide thành công.',
    deleteError:    'Không thể xóa slide. Vui lòng thử lại.',
  },

  // ── Video ─────────────────────────────────────────────────────────────────
  video: {
    requestInfo:   'Yêu cầu tạo video đã được gửi',
    generateError: 'Đã xảy ra lỗi khi tạo video. Vui lòng thử lại.',
    deleteSuccess: 'Xóa video thành công.',
    deleteError:   'Không thể xóa video. Vui lòng thử lại.',
  },

  // ── AI analysis ───────────────────────────────────────────────────────────
  analysis: {
    startInfo: 'Đang phân tích tài liệu...',
    error:     'Phân tích tài liệu thất bại. Vui lòng thử lại.',
  },

  // ── Game ──────────────────────────────────────────────────────────────────
  game: {
    createSuccess: 'Tạo game thành công! Đang chuyển đến trình soạn thảo...',
    createError:   'Tạo game thất bại. Vui lòng thử lại.',
    noSlideError:  'Không tìm thấy dữ liệu slide. Vui lòng lưu slide trước khi tạo game.',
  },

  // ── Sources / Documents ───────────────────────────────────────────────────
  source: {
    uploadSuccess: (name: string) => `Đã tải lên "${name}"`,
    uploadError:   'Tải lên thất bại. Vui lòng thử lại.',
    deleteSuccess: 'Đã xóa tài liệu',
    deleteError:   'Không thể xóa tài liệu.',
  },

  // ── Material (all roles) ─────────────────────────────────────────────────
  /**
   * material.expert  — Expert tạo / sửa / xóa học liệu
   * material.staff   — Staff duyệt / từ chối học liệu
   * material.shop    — Teacher mua học liệu trên cửa hàng
   * material.lib     — Teacher tải / xem học liệu đã mua
   */
  material: {
    expert: {
      uploadSuccess:  'Tải lên tài liệu thành công!',
      uploadError:    'Tải lên thất bại. Vui lòng thử lại.',
      updateSuccess:  'Cập nhật tài liệu thành công!',
      updateError:    'Không thể cập nhật tài liệu. Vui lòng thử lại.',
      deleteSuccess:  'Đã xóa tài liệu thành công',
      deleteError:    'Không thể xóa tài liệu. Vui lòng thử lại.',
    },
    staff: {
      approveSuccess:   'Đã duyệt học liệu thành công',
      rejectSuccess:    'Đã từ chối học liệu',
      reviewError:      'Thao tác thất bại. Vui lòng thử lại.',
      previewError:     'Không có nội dung để xem trước.',
      previewLoadError: 'Không thể tải nội dung xem trước. Vui lòng thử lại.',
    },
    shop: {
      buySuccess: (title: string) => `Đã thêm "${title}" vào thư viện!`,
      buyError:   'Mua tài liệu thất bại. Vui lòng thử lại.',
    },
    lib: {
      downloadError: 'Không thể tải tài liệu. Vui lòng thử lại.',
    },
  },

  // ── Subscription plans (admin) ────────────────────────────────────────────
  plan: {
    createSuccess:  'Tạo gói cước thành công.',
    updateSuccess:  'Cập nhật gói cước thành công.',
    saveError:      'Không thể lưu gói cước. Vui lòng thử lại.',
    deleteSuccess:  (name: string) => `Đã ngưng kích hoạt gói ${name}.`,
    deleteError:    'Không thể xóa gói cước.',
    toggleActive:   (name: string) => `Đã kích hoạt gói ${name}.`,
    toggleInactive: (name: string) => `Đã vô hiệu hóa gói ${name}.`,
  },

  // ── Admin: withdrawal management ─────────────────────────────────────────
  withdrawal: {
    approveSuccess: 'Đã duyệt yêu cầu rút tiền thành công.',
    rejectSuccess:  'Đã từ chối yêu cầu rút tiền.',
    processError:   'Xử lý yêu cầu thất bại. Vui lòng thử lại.',
    noteRequired:   'Vui lòng nhập ghi chú khi từ chối yêu cầu rút tiền.',
  },

  // ── Top-up / payment ─────────────────────────────────────────────────────
  topUp: {
    redirecting:    'Đang chuyển đến cổng thanh toán...',
    noCheckoutUrl:  'Không nhận được đường dẫn thanh toán từ hệ thống.',
    createError:    'Tạo yêu cầu nạp tiền thất bại.',
    verifySuccess:  (code: number, status: string) =>
      `Đã xác minh giao dịch #${code} (${status}).`,
    verifyError:    'Không thể xác minh giao dịch nạp tiền.',
  },

  // ── Subscription purchase ─────────────────────────────────────────────────
  subscription: {
    buySuccess: (name: string, quota: number) =>
      `Mua gói ${name} thành công! +${quota} EduCoin`,
    buyError: 'Mua gói thất bại. Vui lòng kiểm tra số dư ví.',
  },

  // ── Withdrawal request (user-side) ────────────────────────────────────────
  withdrawalRequest: {
    otpSentSuccess: 'Đã gửi OTP xác nhận rút tiền.',
    otpSentError:   'Không thể gửi OTP rút tiền. Vui lòng thử lại.',
    confirmSuccess: 'Yêu cầu rút tiền đã được tạo.',
    confirmError:   'OTP không hợp lệ hoặc đã hết hạn.',
  },

  // ── User profile ──────────────────────────────────────────────────────────
  profile: {
    updateSuccess:    'Cập nhật hồ sơ thành công!',
    updateError:      'Cập nhật hồ sơ thất bại. Vui lòng thử lại.',
    changePwSuccess:  'Đổi mật khẩu thành công!',
    changePwError:    'Đổi mật khẩu thất bại. Vui lòng thử lại.',
  },

  // ── Certification / verification ──────────────────────────────────────────
  cert: {
    submitSuccess: 'Nộp hồ sơ thành công! Đang chờ phê duyệt.',
    deleteSuccess: 'Đã xóa hồ sơ thành công',
    deleteError:   'Không thể xóa hồ sơ. Vui lòng thử lại.',
  },

  // ── Classroom ─────────────────────────────────────────────────────────────
  classroom: {
    createSuccess:         'Đã tạo lớp học',
    createError:           'Tạo lớp thất bại. Vui lòng thử lại.',
    updateSuccess:         'Đã cập nhật lớp học',
    updateError:           'Cập nhật thất bại. Vui lòng thử lại.',
    deleteSuccess:         (name: string) => `Đã xóa lớp "${name}"`,
    deleteError:           'Xóa lớp thất bại. Vui lòng thử lại.',
    importSuccess:         (count: number) => `Đã nhập ${count} học sinh`,
    importError:           'Nhập danh sách thất bại. Vui lòng thử lại.',
    importNoData:          'Không tìm thấy dữ liệu học sinh trong file. Vui lòng kiểm tra lại.',
    importFileError:       'Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng.',
  },

  // ── Templates (admin) ─────────────────────────────────────────────────────
  template: {
    deleteSuccess: 'Đã xóa template thành công',
    deleteError:   'Xóa template thất bại',
    saveSuccess:   'Lưu template thành công.',
    saveError:     'Lưu template thất bại.',
  },

  // ── Staff: expert verification ────────────────────────────────────────────
  staff: {
    approveSuccess: 'Đã duyệt hồ sơ xác minh thành công',
    rejectSuccess:  'Đã từ chối hồ sơ xác minh',
    processError:   'Thao tác thất bại. Vui lòng thử lại.',
  },

  // ── Admin: curriculum ────────────────────────────────────────────────────
  curriculum: {
    gradeCreateSuccess:  'Tạo khối lớp thành công.',
    gradeCreateError:    'Không thể tạo khối lớp.',
    gradeUpdateSuccess:  'Cập nhật khối lớp thành công.',
    gradeDeleteSuccess:  'Xóa khối lớp thành công.',
    gradeDeleteError:    'Không thể xóa khối lớp.',
    subjectCreateSuccess: 'Tạo môn học thành công.',
    subjectCreateError:   'Không thể tạo môn học.',
    subjectUpdateSuccess: 'Cập nhật môn học thành công.',
    subjectDeleteSuccess: 'Xóa môn học thành công.',
    subjectDeleteError:   'Không thể xóa môn học.',
    lessonCreateSuccess:  'Tạo bài học thành công.',
    lessonCreateError:    'Không thể tạo bài học.',
    lessonUpdateSuccess:  'Cập nhật bài học thành công.',
    lessonDeleteSuccess:  'Xóa bài học thành công.',
    lessonDeleteError:    'Không thể xóa bài học.',
    updateError:          'Không thể cập nhật dữ liệu.',
    missingGrade:         'Vui lòng nhập đầy đủ mã và tên khối lớp.',
    missingSubject:       'Vui lòng nhập đầy đủ mã và tên môn học.',
    missingLesson:        'Vui lòng nhập đầy đủ mã bài học, tên bài học và môn học.',
    confirmDeletePrompt:  'Vui lòng nhập đúng từ XOA để xác nhận xóa.',
  },
} as const;
