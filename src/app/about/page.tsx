'use client';

import React from 'react';
import Link from 'next/link';
import {
  Target,
  Users,
  Lightbulb,
  GraduationCap,
  Heart,
  Globe,
  Sparkles,
  ArrowRight,
  BookOpen,
  Zap,
} from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f5ff] via-[#f6f9ff] to-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/60 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm">
            <Users className="w-4 h-4" />
            Về EduVi
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Câu chuyện đằng sau
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              nền tảng EduVi
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            EduVi được tạo ra với sứ mệnh đơn giản: giúp giáo viên Việt Nam tạo bài giảng chất lượng cao
            một cách nhanh chóng và dễ dàng nhờ trí tuệ nhân tạo.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            <div className="group bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-8 lg:p-10 border border-blue-100 hover:shadow-xl hover:shadow-blue-100/40 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Chúng tôi tin rằng mọi giáo viên đều xứng đáng có công cụ hỗ trợ tốt nhất. EduVi ra đời để
                giải phóng giáo viên khỏi những công việc lặp đi lặp lại trong quá trình soạn bài, để họ có thể
                tập trung vào điều quan trọng nhất: truyền cảm hứng cho học sinh.
              </p>
            </div>
            <div className="group bg-gradient-to-br from-violet-50/80 to-purple-50/50 rounded-3xl p-8 lg:p-10 border border-violet-100 hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Trở thành nền tảng công nghệ giáo dục hàng đầu Việt Nam, nơi mỗi giáo viên đều có thể tạo ra
                nội dung giảng dạy xuất sắc chỉ với vài thao tác đơn giản.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Những giá trị định hướng mọi sản phẩm và dịch vụ của EduVi
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GraduationCap,
                title: 'Giáo dục là nền tảng',
                desc: 'Mọi quyết định đều hướng tới việc nâng cao chất lượng giáo dục.',
                accent: '#2563eb',
                bg: '#eff6ff',
              },
              {
                icon: Heart,
                title: 'Đặt giáo viên lên đầu',
                desc: 'Thiết kế sản phẩm xoay quanh nhu cầu thực tế của giáo viên.',
                accent: '#e11d48',
                bg: '#fff1f2',
              },
              {
                icon: Lightbulb,
                title: 'Đổi mới không ngừng',
                desc: 'Liên tục cải tiến công nghệ AI để mang lại trải nghiệm tốt nhất.',
                accent: '#d97706',
                bg: '#fffbeb',
              },
              {
                icon: Globe,
                title: 'Made in Vietnam',
                desc: 'Tối ưu hoàn toàn cho giáo dục Việt Nam và tiếng Việt.',
                accent: '#059669',
                bg: '#ecfdf5',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-7 border border-gray-100 text-center hover:shadow-lg hover:shadow-gray-100/80 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.accent }} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What EduVi offers */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">EduVi mang lại gì?</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Giải pháp toàn diện cho giáo viên trong thời đại số
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Zap, title: 'Tạo bài giảng bằng AI', desc: 'Upload tài liệu, AI tự động phân tích và tạo slide chuyên nghiệp.', color: '#2563eb', bg: '#eff6ff' },
              { icon: BookOpen, title: 'Kho tài liệu giáo dục', desc: 'Chia sẻ và tìm kiếm tài liệu từ cộng đồng giáo viên.', color: '#7c3aed', bg: '#f5f3ff' },
              { icon: Sparkles, title: 'Video bài giảng AI', desc: 'Chuyển slide thành video giảng dạy tự động với AI.', color: '#db2777', bg: '#fdf2f8' },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Đội ngũ phát triển</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              EduVi được xây dựng bởi đội ngũ sinh viên và chuyên gia đam mê giáo dục và công nghệ
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Nguyễn Minh Quang', role: 'Backend Developer', initials: 'NQ', gradient: 'from-blue-500 to-indigo-600' },
              { name: 'Phạm Hồ Tiến Đạt', role: 'Backend Developer', initials: 'PD', gradient: 'from-violet-500 to-purple-600' },
              { name: 'Nguyễn Đào Bách', role: 'Frontend Developer', initials: 'NB', gradient: 'from-cyan-500 to-blue-600' },
              { name: 'Lê Thiên Phúc', role: 'Frontend Developer', initials: 'LP', gradient: 'from-emerald-500 to-teal-600' },
            ].map((member, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-7 text-center border border-gray-100 hover:shadow-xl hover:shadow-gray-100/60 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-18 h-18 bg-gradient-to-br ${member.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 text-white font-bold text-lg shadow-lg`}
                  style={{ width: '4.5rem', height: '4.5rem' }}
                >
                  {member.initials}
                </div>
                <h4 className="font-bold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — light version */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/60 p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-100/50 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-100/50 rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Bạn muốn trải nghiệm EduVi?
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                Bắt đầu trải nghiệm EduVi với quy trình tạo bài giảng trực quan và linh hoạt.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                >
                  Đăng ký miễn phí
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/subscription"
                  className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center hover:shadow-md"
                >
                  Xem bảng giá
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
