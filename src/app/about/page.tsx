'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Users, Lightbulb, GraduationCap, Heart, Globe } from 'lucide-react';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
            Về chúng tôi
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            EduVi được tạo ra với sứ mệnh đơn giản: giúp giáo viên Việt Nam tạo bài giảng chất lượng cao một cách nhanh chóng và dễ dàng nhờ trí tuệ nhân tạo.
          </p>
        </div>
      </section>

      {/* Sứ mệnh & Tầm nhìn */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 lg:p-10 border border-blue-100">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh</h2>
              <p className="text-gray-600 leading-relaxed">
                Chúng tôi tin rằng mọi giáo viên đều xứng đáng có công cụ hỗ trợ tốt nhất. EduVi ra đời để giải phóng giáo viên khỏi những công việc lặp đi lặp lại trong quá trình soạn bài, để họ có thể tập trung vào điều quan trọng nhất: truyền cảm hứng cho học sinh.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 lg:p-10 border border-purple-100">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tầm nhìn</h2>
              <p className="text-gray-600 leading-relaxed">
                Trở thành nền tảng công nghệ giáo dục hàng đầu Việt Nam, nơi mỗi giáo viên đều có thể tạo ra nội dung giảng dạy xuất sắc chỉ với vài thao tác đơn giản.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Những giá trị định hướng mọi sản phẩm và dịch vụ của EduVi
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, title: 'Giáo dục là nền tảng', desc: 'Mọi quyết định đều hướng tới việc nâng cao chất lượng giáo dục.', color: 'blue' },
              { icon: Heart, title: 'Đặt giáo viên lên đầu', desc: 'Thiết kế sản phẩm xoay quanh nhu cầu thực tế của giáo viên.', color: 'red' },
              { icon: Lightbulb, title: 'Đổi mới không ngừng', desc: 'Liên tục cải tiến công nghệ AI để mang lại trải nghiệm tốt nhất.', color: 'amber' },
              { icon: Globe, title: 'Made in Vietnam', desc: 'Tối ưu hoàn toàn cho giáo dục Việt Nam và tiếng Việt.', color: 'green' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                  item.color === 'blue' ? 'bg-blue-100' : item.color === 'red' ? 'bg-red-100' : item.color === 'amber' ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <item.icon className={`w-6 h-6 ${
                    item.color === 'blue' ? 'text-blue-600' : item.color === 'red' ? 'text-red-600' : item.color === 'amber' ? 'text-amber-600' : 'text-green-600'
                  }`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Đội ngũ phát triển</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              EduVi được xây dựng bởi đội ngũ sinh viên và chuyên gia đam mê giáo dục và công nghệ
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Đội ngũ phát triển', role: 'SEP490 - FPT University', initials: 'FU' },
              { name: 'Chuyên gia giáo dục', role: 'Cố vấn nội dung', initials: 'ED' },
              { name: 'Đội ngũ AI', role: 'Nghiên cứu & phát triển', initials: 'AI' },
            ].map((member, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {member.initials}
                </div>
                <h4 className="font-semibold text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Bạn muốn trải nghiệm EduVi?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Đăng ký ngay để bắt đầu tạo bài giảng với AI miễn phí.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Liên hệ chúng tôi
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
