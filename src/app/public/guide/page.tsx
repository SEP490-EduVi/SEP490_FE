'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Download,
  ChevronDown,
  CheckCircle2,
  Gamepad2,
  HelpCircle,
  Play,
  Layers,
  WifiOff,
  Presentation,
  FileDown,
  Shield,
  Mail,
  Sparkles,
} from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

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
      'App sẽ tự thông báo khi có bản cập nhật mới. Bạn cũng có thể tải bản mới nhất từ trang này. Chỉ cần cài đè lên bản cũ là xong.',
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

const INSTALL_STEPS = [
  {
    step: 1,
    title: 'Tải file cài đặt',
    desc: 'Nhấn nút "Tải EduVi Desktop" bên trên để tải file ZIP. Giải nén file sau khi tải về.',
    icon: Download,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    step: 2,
    title: 'Chạy file cài đặt',
    desc: 'Mở file vừa giải nén. Windows có thể hiện cảnh báo SmartScreen — nhấn "More info" rồi "Run anyway". macOS: kéo biểu tượng vào thư mục Applications.',
    icon: Play,
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    step: 3,
    title: 'Đăng nhập tài khoản',
    desc: 'Mở EduVi Desktop, đăng nhập bằng tài khoản giáo viên của bạn. Dữ liệu bài giảng sẽ tự động đồng bộ từ tài khoản web.',
    icon: CheckCircle2,
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    step: 4,
    title: 'Mở file .eduvi để dạy',
    desc: 'Từ trang web, xuất bài giảng thành file .eduvi. Mở file đó bằng EduVi Desktop để bắt đầu buổi học với đầy đủ tính năng tương tác.',
    icon: Layers,
    color: '#ea580c',
    bg: '#fff7ed',
  },
];

const FEATURES = [
  {
    icon: WifiOff,
    title: 'Sử dụng offline',
    desc: 'Tải bài giảng về máy và dạy học mà không cần kết nối internet. Phù hợp với phòng học có mạng không ổn định.',
    accent: '#0ea5e9',
    bg: '#f0f9ff',
  },
  {
    icon: Gamepad2,
    title: 'Chơi game tương tác',
    desc: 'Học sinh giơ tay trước camera để chơi game giáo dục qua MediaPipe — không cần thiết bị phụ, chỉ cần webcam.',
    accent: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: Presentation,
    title: 'Thuyết trình slide',
    desc: 'Phát slide toàn màn hình ngay trên Desktop, chuyển trang mượt, phù hợp với màn chiếu trong lớp học.',
    accent: '#2563eb',
    bg: '#eff6ff',
  },
  {
    icon: FileDown,
    title: 'Mở file .eduvi',
    desc: 'Xuất bài giảng từ web thành file .eduvi, mở bằng Desktop để dạy với đầy đủ game, slide và tài nguyên đã đóng gói.',
    accent: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: Shield,
    title: 'An toàn & bảo mật',
    desc: 'Dữ liệu bài giảng được mã hóa và lưu trữ an toàn. Tài khoản giáo viên được bảo vệ qua xác thực đăng nhập.',
    accent: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: Monitor,
    title: 'Hiệu năng cao',
    desc: 'Chạy native trên hệ điều hành, xử lý camera và AI nhanh hơn nhiều so với trình duyệt web.',
    accent: '#ef4444',
    bg: '#fef2f2',
  },
];

function FaqItem({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        open ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-900 leading-snug">{item.question}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100/60 pt-4">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export default function PublicGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f9ff] to-white">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero download */}
        <section className="rounded-3xl overflow-hidden mb-10 border border-blue-100">
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-32 right-0 w-80 h-80 bg-blue-100/50 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 -left-20 w-48 h-48 bg-violet-100/50 rounded-full blur-[80px]" />
            </div>

            <div className="relative p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-blue-700 border border-blue-200/60 mb-5 shadow-sm">
                  <Monitor className="w-3.5 h-3.5" />
                  Ứng dụng Desktop
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  EduVi Desktop
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed max-w-lg mb-6">
                  Dạy học tương tác với game MediaPipe, trình chiếu slide toàn màn hình, và hoạt động
                  offline. Hỗ trợ Windows 10/11 và macOS 12+.
                </p>
                <a
                  href="https://github.com/SEP490-EduVi/SEP490_FE/releases/download/v1.0.0/Eduvi-App.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  Tải EduVi Desktop (.zip)
                </a>
              </div>

              {/* Mini app mockup */}
              <div className="hidden sm:block flex-shrink-0">
                <div className="w-56 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-xl shadow-blue-100/40">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                    <span className="ml-auto text-[10px] text-gray-400 font-medium">EduVi</span>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="h-16 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100/60">
                      <Presentation className="w-6 h-6 text-blue-300" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-7 rounded-lg bg-violet-50 border border-violet-100/60 flex items-center justify-center">
                        <Gamepad2 className="w-3 h-3 text-violet-300" />
                      </div>
                      <div className="flex-1 h-7 rounded-lg bg-emerald-50 border border-emerald-100/60 flex items-center justify-center">
                        <WifiOff className="w-3 h-3 text-emerald-300" />
                      </div>
                      <div className="flex-1 h-7 rounded-lg bg-blue-50 border border-blue-100/60 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-blue-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick info bar */}
          <div className="bg-white border-t border-blue-100/60 px-6 sm:px-8 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Miễn phí hoàn toàn
            </span>
            <span>Windows 10/11</span>
            <span>macOS 12+</span>
            <span>RAM 8GB+</span>
          </div>
        </section>

        {/* Features */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Tính năng nổi bật</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Những gì bạn có thể làm với EduVi Desktop</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-100/60 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Install steps */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Hướng dẫn cài đặt</h2>
          <p className="text-sm text-gray-500 mb-6">4 bước để bắt đầu sử dụng</p>

          <div className="space-y-4">
            {INSTALL_STEPS.map((s) => (
              <div
                key={s.step}
                className="group flex gap-5 p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: s.color }}
                >
                  {s.step}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} item={item} />
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="relative rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/60 p-8 sm:p-10 text-center mb-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-100/50 rounded-full blur-[60px]" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-100/50 rounded-full blur-[60px]" />
          </div>
          <div className="relative">
            <p className="text-xl font-bold text-gray-900 mb-2">Vẫn cần hỗ trợ?</p>
            <p className="text-sm text-gray-500 mb-6">
              Liên hệ đội ngũ EduVi qua email hoặc nhóm cộng đồng giáo viên.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://github.com/SEP490-EduVi/SEP490_FE/releases/download/v1.0.0/Eduvi-App.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                Tải app
              </a>
              <a
                href="mailto:support@eduvi.vn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-md"
              >
                <Mail className="w-4 h-4" />
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
