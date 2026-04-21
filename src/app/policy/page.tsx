'use client';

import React from 'react';
import { Shield, Lock, Eye, FileCheck, AlertTriangle } from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

const LAST_UPDATED = '01/04/2026';

const sections = [
  {
    icon: Eye,
    title: '1. Thu thập thông tin',
    content: [
      'Khi bạn đăng ký tài khoản EduVi, chúng tôi thu thập các thông tin cần thiết bao gồm: họ tên, địa chỉ email, số điện thoại (tùy chọn) và thông tin đăng nhập.',
      'Khi sử dụng dịch vụ, chúng tôi có thể thu thập thông tin về cách bạn tương tác với nền tảng, bao gồm tài liệu tải lên, bài giảng tạo ra, và lịch sử giao dịch.',
      'Chúng tôi không thu thập bất kỳ thông tin nhạy cảm nào ngoài phạm vi cần thiết để cung cấp dịch vụ.',
    ],
  },
  {
    icon: Lock,
    title: '2. Sử dụng thông tin',
    content: [
      'Thông tin của bạn được sử dụng để: cung cấp và duy trì dịch vụ, xử lý thanh toán, gửi thông báo về tài khoản, và cải thiện trải nghiệm người dùng.',
      'Chúng tôi có thể sử dụng dữ liệu ẩn danh để phân tích xu hướng, nghiên cứu và phát triển tính năng mới cho nền tảng.',
      'Chúng tôi KHÔNG bán, cho thuê hay chia sẻ thông tin cá nhân của bạn với bên thứ ba vì mục đích thương mại.',
    ],
  },
  {
    icon: Shield,
    title: '3. Bảo mật dữ liệu',
    content: [
      'EduVi áp dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu của bạn, bao gồm mã hóa SSL/TLS, xác thực hai yếu tố và kiểm soát truy cập nghiêm ngặt.',
      'Tài liệu bài giảng và nội dung do bạn tạo ra thuộc quyền sở hữu của bạn. Chúng tôi chỉ lưu trữ trên máy chủ bảo mật và không sử dụng cho bất kỳ mục đích nào khác.',
      'Dữ liệu được lưu trữ trên hệ thống cloud có chứng nhận bảo mật quốc tế.',
    ],
  },
  {
    icon: FileCheck,
    title: '4. Quyền của người dùng',
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
      <section className="bg-[radial-gradient(circle_at_top_right,_#e8f0ff_0,_#f7fbff_45%,_#edf4ff_100%)] pt-10 pb-16 sm:pt-12 sm:pb-20 border-b border-[#dde8ff]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/90 border border-[#d5e3ff] text-[#2e5fb0] rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Chính sách & Điều khoản
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#122a58] mb-4">
            Chính sách bảo mật
          </h1>
          <p className="text-lg text-[#4d6691] max-w-2xl mx-auto">
            Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Vui lòng đọc kỹ chính sách dưới đây.
          </p>
          <p className="text-sm text-[#7a93bb] mt-4">
            Cập nhật lần cuối: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 pt-1">{section.title}</h2>
                </div>
                <div className="space-y-3 ml-14">
                  {section.content.map((paragraph, j) => (
                    <p key={j} className="text-gray-600 leading-relaxed text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact for questions */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-8 border border-blue-100 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Có câu hỏi về chính sách?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nếu bạn có bất kỳ thắc mắc nào về chính sách bảo mật hoặc cách chúng tôi xử lý dữ liệu của bạn, vui lòng liên hệ:
            </p>
            <a
              href="mailto:pdat1746@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-blue-600 bg-white rounded-xl border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"
            >
              pdat1746@gmail.com


            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
