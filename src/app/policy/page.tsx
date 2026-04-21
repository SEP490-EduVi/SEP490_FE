'use client';

import React from 'react';
import { Shield, Lock, Eye, FileCheck, AlertTriangle, Mail } from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

const LAST_UPDATED = '01/04/2026';

const sections = [
  {
    icon: Eye,
    title: '1. Thu thập thông tin',
    accent: '#2563eb',
    bg: '#eff6ff',
    content: [
      'Khi bạn đăng ký tài khoản EduVi, chúng tôi thu thập các thông tin cần thiết bao gồm: họ tên, địa chỉ email, số điện thoại (tùy chọn) và thông tin đăng nhập.',
      'Khi sử dụng dịch vụ, chúng tôi có thể thu thập thông tin về cách bạn tương tác với nền tảng, bao gồm tài liệu tải lên, bài giảng tạo ra, và lịch sử giao dịch.',
      'Chúng tôi không thu thập bất kỳ thông tin nhạy cảm nào ngoài phạm vi cần thiết để cung cấp dịch vụ.',
    ],
  },
  {
    icon: Lock,
    title: '2. Sử dụng thông tin',
    accent: '#7c3aed',
    bg: '#f5f3ff',
    content: [
      'Thông tin của bạn được sử dụng để: cung cấp và duy trì dịch vụ, xử lý thanh toán, gửi thông báo về tài khoản, và cải thiện trải nghiệm người dùng.',
      'Chúng tôi có thể sử dụng dữ liệu ẩn danh để phân tích xu hướng, nghiên cứu và phát triển tính năng mới cho nền tảng.',
      'Chúng tôi KHÔNG bán, cho thuê hay chia sẻ thông tin cá nhân của bạn với bên thứ ba vì mục đích thương mại.',
    ],
  },
  {
    icon: Shield,
    title: '3. Bảo mật dữ liệu',
    accent: '#059669',
    bg: '#ecfdf5',
    content: [
      'EduVi áp dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu của bạn, bao gồm mã hóa SSL/TLS, xác thực hai yếu tố và kiểm soát truy cập nghiêm ngặt.',
      'Tài liệu bài giảng và nội dung do bạn tạo ra thuộc quyền sở hữu của bạn. Chúng tôi chỉ lưu trữ trên máy chủ bảo mật và không sử dụng cho bất kỳ mục đích nào khác.',
      'Dữ liệu được lưu trữ trên hệ thống cloud có chứng nhận bảo mật quốc tế.',
    ],
  },
  {
    icon: FileCheck,
    title: '4. Quyền của người dùng',
    accent: '#0891b2',
    bg: '#ecfeff',
    content: [
      'Bạn có quyền truy cập, chỉnh sửa và xóa thông tin cá nhân của mình bất kỳ lúc nào thông qua trang Quản lý tài khoản.',
      'Bạn có quyền yêu cầu xuất toàn bộ dữ liệu cá nhân mà chúng tôi lưu trữ.',
      'Bạn có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan. Yêu cầu sẽ được xử lý trong vòng 30 ngày.',
      'Bạn có quyền từ chối nhận email marketing bất kỳ lúc nào.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '5. Điều khoản sử dụng',
    accent: '#ea580c',
    bg: '#fff7ed',
    content: [
      'Bằng việc sử dụng EduVi, bạn đồng ý tuân thủ các điều khoản sử dụng. Bạn cam kết không sử dụng dịch vụ cho bất kỳ mục đích bất hợp pháp nào.',
      'Nội dung được tạo bằng AI mang tính chất hỗ trợ. Giáo viên chịu trách nhiệm kiểm tra và đảm bảo tính chính xác của nội dung trước khi sử dụng trong giảng dạy.',
      'EduVi có quyền đình chỉ hoặc chấm dứt tài khoản nếu phát hiện vi phạm nghiêm trọng các điều khoản sử dụng.',
      'Chúng tôi có quyền cập nhật chính sách này theo thời gian. Thay đổi quan trọng sẽ được thông báo qua email đăng ký.',
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f5ff] via-[#f6f9ff] to-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 -left-24 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/60 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
            <Shield className="w-4 h-4" />
            Chính sách & Điều khoản
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Chính sách bảo mật
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn.
            Vui lòng đọc kỹ chính sách dưới đây.
          </p>
          <p className="text-sm text-gray-400 mt-5">
            Cập nhật lần cuối: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <div
                key={i}
                className="group rounded-3xl p-7 sm:p-8 border border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-100/60 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: section.bg }}
                  >
                    <section.icon className="w-6 h-6" style={{ color: section.accent }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 pt-2">{section.title}</h2>
                </div>
                <div className="space-y-4 ml-16">
                  {section.content.map((paragraph, j) => (
                    <p key={j} className="text-gray-600 leading-relaxed text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-12 relative rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/60 p-8 sm:p-10 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-100/50 rounded-full blur-[60px]" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-100/50 rounded-full blur-[60px]" />
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Có câu hỏi về chính sách?</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Nếu bạn có bất kỳ thắc mắc nào về chính sách bảo mật hoặc cách chúng tôi xử lý dữ liệu,
                vui lòng liên hệ:
              </p>
              <a
                href="mailto:pdat1746@gmail.com"
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-blue-600 bg-white rounded-2xl border border-blue-200/60 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
              >
                <Mail className="w-4 h-4" />
                pdat1746@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
