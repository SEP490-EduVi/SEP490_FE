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
  Monitor,
  Download,
  Cpu,
  Gamepad2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

const ROLE_HOME: Record<string, string> = {
  admin:  '/admin',
  staff:  '/staff',
  expert: '/expert',
};

export default function HomePage() {
  const router = useRouter();
  const { hydrate, role, isHydrated } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    const redirect = ROLE_HOME[role];
    if (redirect) router.replace(redirect);
  }, [isHydrated, role, router]);

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
      {/* App Desktop Download */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
                <Monitor className="w-4 h-4" />
                Ứng dụng Desktop
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Tải EduVi App <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  cho máy tính của bạn
                </span>
              </h2>
              <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                Phiên bản desktop mang lại trải nghiệm mượt mà hơn — chạy bài giảng tương tác, game giáo dục với camera trực tiếp ngay trên máy tính của bạn.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Cpu, label: 'Hiệu năng cao', desc: 'Xử lý camera & AI nhanh hơn' },
                  { icon: Gamepad2, label: 'Game tương tác', desc: 'Trò chơi giáo dục MediaPipe' },
                  { icon: Monitor, label: 'Màn hình lớn', desc: 'Toàn màn hình cho lớp học' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1 bg-white/5 rounded-xl p-3 border border-white/10">
                    <f.icon className="w-5 h-5 text-blue-400 mb-1" />
                    <p className="text-white text-sm font-semibold leading-tight">{f.label}</p>
                    <p className="text-slate-400 text-xs leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://drive.google.com/drive/folders/1hp2u5Aq0LXnf3TrpcALzF8EXG7AKGyoF?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Tải EduVi Desktop
                </a>
                <a
                  href="/teacher/guide"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 font-medium text-sm transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Xem hướng dẫn cài đặt
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-500">Hỗ trợ Windows 10/11 và macOS 12+</p>
            </div>

            {/* Right: mock window */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-md bg-slate-800/60 backdrop-blur rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* titlebar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/60">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="flex-1 text-center text-xs text-slate-500">EduVi Desktop</span>
                </div>
                {/* content mock */}
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-blue-500/30 rounded-lg w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-24 bg-indigo-500/20 rounded-xl border border-indigo-500/20 flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-indigo-400/60" />
                    </div>
                    <div className="h-24 bg-cyan-500/20 rounded-xl border border-cyan-500/20 flex items-center justify-center">
                      <Video className="w-8 h-8 text-cyan-400/60" />
                    </div>
                  </div>
                  <div className="h-3 bg-white/10 rounded w-4/5" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            </div>
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
