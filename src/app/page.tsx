'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  CheckCircle,
  Palette,
  ImagePlus,
  Edit3,
  BookOpen,
  Video,
  BarChart3,
  Globe,
  Users,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

export default function HomePage() {
  const router = useRouter();
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fbff]">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#e8f0ff_0,_#f8fbff_45%,_#edf4ff_100%)]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/90 border border-[#d5e3ff] text-[#2e5fb0] rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Nền tảng hỗ trợ giáo viên với AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Tạo bài giảng chuyên nghiệp{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                cùng AI
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-[#4d6691] max-w-2xl mx-auto mb-10 leading-relaxed">
              EduVi giúp giáo viên tạo slide bài giảng, video giảng dạy và nội dung tương tác chỉ trong vài phút với sức mạnh của trí tuệ nhân tạo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                Bắt đầu miễn phí
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/subscription')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Xem bảng giá
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Bắt đầu nhanh</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Giao diện tiếng Việt</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Hỗ trợ nhiều môn học</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tính năng chính */}
      <section className="py-20 sm:py-28 bg-[#f8fbff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mọi thứ bạn cần để tạo bài giảng xuất sắc
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Từ ý tưởng đến bài giảng hoàn chỉnh, EduVi đồng hành cùng bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div
              onClick={() => router.push('/register')}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-[0_20px_45px_-20px_rgba(47,93,184,0.35)] transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-5">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo bài giảng bằng AI</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Chỉ cần mô tả chủ đề, AI sẽ tạo ra bố cục bài giảng, nội dung slide và gợi ý hình ảnh phù hợp.
              </p>
              <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-3 gap-2 transition-all text-sm">
                Bắt đầu với AI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => router.push('/subscription')}
              className="group cursor-pointer bg-gradient-to-br from-indigo-50 to-blue-100/60 rounded-3xl p-8 border border-indigo-100 hover:border-indigo-300 hover:shadow-[0_20px_45px_-20px_rgba(47,93,184,0.35)] transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-5">
                <Edit3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chỉnh sửa Slide trực quan</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Trình chỉnh sửa kéo thả mạnh mẽ với thư viện mẫu và tài nguyên giáo dục phong phú.
              </p>
              <span className="inline-flex items-center text-purple-600 font-medium group-hover:gap-3 gap-2 transition-all text-sm">
                Mở trình chỉnh sửa <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tại sao chọn EduVi */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn EduVi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Được thiết kế đặc biệt cho giáo viên và nhà giáo dục Việt Nam
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'AI thông minh', desc: 'Tự động tạo nội dung bài giảng từ tài liệu đầu vào của bạn', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
              { icon: Palette, title: 'Thiết kế chuyên nghiệp', desc: 'Hàng trăm mẫu slide đẹp mắt, phù hợp với nhiều môn học', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
              { icon: Video, title: 'Tạo video bài giảng', desc: 'Chuyển đổi slide thành video giảng dạy chất lượng cao tự động', bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
              { icon: BookOpen, title: 'Kho tài liệu phong phú', desc: 'Thư viện tài liệu giáo dục được đóng góp bởi cộng đồng chuyên gia', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
              { icon: BarChart3, title: 'Phân tích chương trình', desc: 'AI phân tích và đánh giá nội dung theo khung chương trình chuẩn', bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
              { icon: Globe, title: 'Tiếng Việt hoàn toàn', desc: 'Giao diện và nội dung AI được tối ưu hoàn toàn cho tiếng Việt', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Số liệu */}
      <section className="py-16 bg-gradient-to-r from-[#2e5fb0] to-[#4b79c8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: 'Nhiều', label: 'Giáo viên đang sử dụng' },
              { value: 'Đa dạng', label: 'Mẫu và nội dung bài giảng' },
              { value: 'Linh hoạt', label: 'Hình thức triển khai' },
              { value: 'Tập trung', label: 'Vào chất lượng giảng dạy' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-extrabold mb-1">{stat.value}</div>
                <div className="text-sm text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sẵn sàng nâng tầm bài giảng của bạn?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn giáo viên đang sử dụng EduVi để tạo ra những bài giảng ấn tượng.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              Đăng ký miễn phí ngay
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/about"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-center"
            >
              Tìm hiểu về EduVi
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
