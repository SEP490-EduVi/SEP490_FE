'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Monitor,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Cpu,
  Gamepad2,
  HelpCircle,
  ExternalLink,
  Play,
  Layers,
  Camera,
} from 'lucide-react';
import AppHeader from '@/components/sidebar/AppHeader';

// ── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    question: 'EduVi Desktop khác gì so với phiên bản web?',
    answer:
      'EduVi Desktop được tối ưu để chạy các tính năng yêu cầu hiệu năng cao như game tương tác MediaPipe (nhận diện chuyển động tay qua camera), phát bài giảng toàn màn hình trực tiếp trong lớp học. Phiên bản web phù hợp để soạn thảo, còn Desktop phù hợp để triển khai trong giờ dạy.',
  },
  {
    question: 'Máy tính cần cấu hình tối thiểu như thế nào?',
    answer:
      'Yêu cầu tối thiểu: Windows 10 64-bit hoặc macOS 12 (Monterey) trở lên. RAM 8GB, CPU 4 nhân (Intel Core i5 / AMD Ryzen 5 thế hệ 8 trở lên). Cần có webcam để sử dụng tính năng game tương tác nhận diện tay.',
  },
  {
    question: 'Tôi có cần kết nối internet khi dùng app không?',
    answer:
      'Bạn cần internet để đăng nhập lần đầu và đồng bộ bài giảng từ tài khoản. Sau khi tải dữ liệu về, một số tính năng như chạy bài giảng và game có thể hoạt động offline.',
  },
  {
    question: 'Làm sao để cập nhật lên phiên bản mới?',
    answer:
      'App sẽ tự thông báo khi có bản cập nhật mới. Bạn cũng có thể tải bản mới nhất theo link Google Drive bên trên. Chỉ cần cài đè lên bản cũ là xong.',
  },
  {
    question: 'File .eduvi là gì và dùng thế nào?',
    answer:
      'File .eduvi là định dạng bài giảng riêng của EduVi, chứa toàn bộ slide, game và tài nguyên đã đóng gói. Bạn xuất file .eduvi từ trang web, sau đó mở bằng EduVi Desktop để chạy trong lớp học mà không cần trình duyệt.',
  },
  {
    question: 'Camera không được nhận diện trong game tương tác?',
    answer:
      'Kiểm tra: (1) Cấp quyền camera cho ứng dụng trong cài đặt hệ thống. (2) Không có ứng dụng khác đang dùng camera. (3) Thử chọn lại nguồn camera trong cài đặt game. (4) Đảm bảo ánh sáng phòng đủ sáng để nhận diện tay tốt hơn.',
  },
  {
    question: 'Tôi có thể dùng tài khoản giáo viên trên nhiều máy không?',
    answer:
      'Có, tài khoản EduVi có thể đăng nhập trên nhiều thiết bị cùng lúc. Bài giảng và dữ liệu được lưu trên cloud, tự đồng bộ khi bạn đăng nhập.',
  },
];

// ── Install steps ─────────────────────────────────────────────────────────────
const INSTALL_STEPS = [
  {
    step: 1,
    title: 'Tải file cài đặt',
    desc: 'Nhấn nút "Tải EduVi Desktop" bên trên để đến trang Google Drive. Chọn đúng file phù hợp với hệ điều hành của bạn (.exe cho Windows, .dmg cho macOS).',
    icon: Download,
  },
  {
    step: 2,
    title: 'Chạy file cài đặt',
    desc: 'Mở file vừa tải. Windows có thể hiện cảnh báo SmartScreen — nhấn "More info" → "Run anyway". macOS: kéo biểu tượng vào thư mục Applications.',
    icon: Play,
  },
  {
    step: 3,
    title: 'Đăng nhập tài khoản',
    desc: 'Mở EduVi Desktop, đăng nhập bằng tài khoản giáo viên của bạn. Dữ liệu bài giảng sẽ tự động đồng bộ từ tài khoản web.',
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: 'Mở file .eduvi để dạy',
    desc: 'Từ trang web, xuất bài giảng thành file .eduvi. Mở file đó bằng EduVi Desktop để bắt đầu buổi học với đầy đủ tính năng tương tác.',
    icon: Layers,
  },
];

// ── Feature highlights ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Gamepad2,
    title: 'Game tương tác MediaPipe',
    desc: 'Học sinh tham gia trò chơi giáo dục bằng cách giơ tay trước camera — không cần thiết bị phụ.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Camera,
    title: 'Nhận diện chuyển động',
    desc: 'AI nhận diện tay và cử chỉ theo thời gian thực, tạo trải nghiệm học tương tác sinh động.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Monitor,
    title: 'Trình chiếu toàn màn hình',
    desc: 'Phát slide toàn màn hình, chuyển trang mượt mà, phù hợp với màn chiếu trong lớp.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Cpu,
    title: 'Hiệu năng native',
    desc: 'Xử lý camera và AI nhanh hơn trình duyệt nhờ chạy native trên hệ điều hành.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

// ── FAQ Item component ────────────────────────────────────────────────────────
function FaqItem({ item }: { item: typeof FAQ_ITEMS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 leading-snug">{item.question}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {item.answer}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TeacherGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Back + Header */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/25">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn sử dụng EduVi</h1>
              <p className="text-sm text-gray-500 mt-0.5">Tải app desktop và bắt đầu dạy học tương tác</p>
            </div>
          </div>
        </div>

        {/* Download card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 right-16 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <p className="text-blue-100 text-sm mb-1">Phiên bản mới nhất</p>
              <h2 className="text-2xl font-bold mb-2">EduVi Desktop App</h2>
              <p className="text-blue-200 text-sm">Hỗ trợ Windows 10/11 · macOS 12+</p>
            </div>
            <a
              href="https://drive.google.com/drive/folders/1hp2u5Aq0LXnf3TrpcALzF8EXG7AKGyoF?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Tải về ngay
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tính năng nổi bật của bản Desktop</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Install steps */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn cài đặt từng bước</h2>
          <div className="space-y-3">
            {INSTALL_STEPS.map((s) => (
              <div key={s.step} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-blue-600/25">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                <s.icon className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Contact support */}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-600 font-medium">Vẫn còn thắc mắc?</p>
          <p className="text-xs text-gray-400 mt-1">Liên hệ đội hỗ trợ EduVi qua email hoặc nhóm cộng đồng giáo viên.</p>
        </div>
      </main>
    </div>
  );
}
