'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  CheckCircle,
  Palette,
  Edit3,
  BookOpen,
  Video,
  BarChart3,
  Globe,
  Monitor,
  Download,
  Gamepad2,
  Play,
  Sparkles,
  Star,
  GraduationCap,
  FileText,
  Layers,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicHeader from '@/components/common/PublicHeader';
import PublicFooter from '@/components/common/PublicFooter';

const ROLE_HOME: Record<string, string> = {
  admin:   '/admin',
  teacher: '/teacher',
  staff:   '/staff',
  expert:  '/expert',
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
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eef4ff] via-[#f5f8ff] to-white">

        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #bfcfef 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.45,
          }}
        />

        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 right-0 w-[700px] h-[700px] bg-blue-200/40 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-indigo-200/35 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-violet-100/25 rounded-full blur-[160px]" />
        </div>

        {/* Floating bubbles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { size: 'w-14 h-14', pos: 'top-[12%] left-[8%]', delay: '0s', duration: '7s', opacity: 'opacity-30', color: 'bg-blue-400' },
            { size: 'w-8 h-8',  pos: 'top-[22%] left-[18%]', delay: '1.2s', duration: '9s', opacity: 'opacity-20', color: 'bg-indigo-400' },
            { size: 'w-5 h-5',  pos: 'top-[8%] right-[22%]', delay: '0.5s', duration: '8s', opacity: 'opacity-25', color: 'bg-violet-400' },
            { size: 'w-10 h-10', pos: 'top-[40%] right-[6%]', delay: '2s', duration: '10s', opacity: 'opacity-20', color: 'bg-blue-300' },
            { size: 'w-6 h-6',  pos: 'bottom-[18%] left-[12%]', delay: '0.8s', duration: '7.5s', opacity: 'opacity-25', color: 'bg-indigo-300' },
            { size: 'w-12 h-12', pos: 'bottom-[10%] right-[15%]', delay: '1.5s', duration: '9.5s', opacity: 'opacity-15', color: 'bg-violet-300' },
            { size: 'w-4 h-4',  pos: 'top-[55%] left-[5%]', delay: '3s', duration: '8s', opacity: 'opacity-20', color: 'bg-blue-500' },
          ].map((b, i) => (
            <div
              key={i}
              className={`absolute ${b.size} ${b.pos} ${b.color} ${b.opacity} rounded-full`}
              style={{
                animation: `floatBubble ${b.duration} ease-in-out infinite`,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>

        {/* Cross / plus decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {[
            { pos: 'top-[15%] right-[10%]', size: 24, opacity: 0.18, color: '#6366f1', rotate: 0 },
            { pos: 'top-[50%] left-[4%]',  size: 18, opacity: 0.14, color: '#3b82f6', rotate: 45 },
            { pos: 'bottom-[20%] right-[8%]', size: 20, opacity: 0.16, color: '#8b5cf6', rotate: 15 },
            { pos: 'top-[35%] right-[25%]', size: 14, opacity: 0.12, color: '#60a5fa', rotate: 30 },
            { pos: 'bottom-[35%] left-[20%]', size: 16, opacity: 0.13, color: '#a78bfa', rotate: 0 },
          ].map((c, i) => (
            <svg
              key={i}
              className={`absolute ${c.pos}`}
              width={c.size} height={c.size}
              viewBox="0 0 24 24"
              style={{ opacity: c.opacity, transform: `rotate(${c.rotate}deg)` }}
            >
              <line x1="12" y1="2" x2="12" y2="22" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="2" y1="12" x2="22" y2="12" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ))}
        </div>

        <style>{`
          @keyframes floatBubble {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-18px) scale(1.06); }
          }
        `}</style>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/60 text-blue-700 rounded-full text-sm font-medium mb-8 shadow-sm hover:shadow-md transition-shadow">
              <Sparkles className="w-4 h-4" />
              Nền tảng hỗ trợ giáo viên bằng AI
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Tạo bài giảng chuyên nghiệp
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                chỉ trong vài phút
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              EduVi giúp giáo viên tạo slide, video giảng dạy và nội dung tương tác
              với sức mạnh của trí tuệ nhân tạo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Bắt đầu miễn phí
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/subscription')}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-md"
              >
                Xem bảng giá
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> Hoàn toàn miễn phí
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> Giao diện tiếng Việt
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> Hỗ trợ nhiều môn học
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN FEATURES — 2 big cards */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.35 }} />
        {/* Corner blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-100/40 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-100/35 rounded-full blur-[90px] pointer-events-none" />
        {/* Cross decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { pos: 'top-[10%] right-[5%]', size: 20, opacity: 0.15, color: '#6366f1', rotate: 15 },
            { pos: 'bottom-[12%] left-[6%]', size: 16, opacity: 0.13, color: '#3b82f6', rotate: 0 },
            { pos: 'top-[45%] left-[2%]', size: 14, opacity: 0.12, color: '#8b5cf6', rotate: 30 },
          ].map((c, i) => (
            <svg key={i} className={`absolute ${c.pos}`} width={c.size} height={c.size} viewBox="0 0 24 24" style={{ opacity: c.opacity, transform: `rotate(${c.rotate}deg)` }}>
              <line x1="12" y1="2" x2="12" y2="22" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="2" y1="12" x2="22" y2="12" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mọi thứ bạn cần để tạo bài giảng xuất sắc
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Từ ý tưởng đến bài giảng hoàn chỉnh, EduVi đồng hành cùng bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div
              onClick={() => router.push('/register')}
              className="group cursor-pointer rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tạo bài giảng bằng AI</h3>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Chỉ cần mô tả chủ đề, AI sẽ tạo ra bố cục bài giảng, nội dung slide và gợi ý hình ảnh phù hợp.
              </p>
              <span className="inline-flex items-center text-blue-600 font-semibold gap-2 text-sm group-hover:gap-3 transition-all">
                Bắt đầu với AI <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div
              onClick={() => router.push('/subscription')}
              className="group cursor-pointer rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-violet-50/80 to-purple-50/50 border border-violet-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <Edit3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chỉnh sửa Slide trực quan</h3>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Trình chỉnh sửa kéo thả mạnh mẽ với thư viện mẫu và tài nguyên giáo dục phong phú.
              </p>
              <span className="inline-flex items-center text-violet-600 font-semibold gap-2 text-sm group-hover:gap-3 transition-all">
                Mở trình chỉnh sửa <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHY EDUVI — 6 feature cards */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-[#f0f5ff]/60 to-white">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-blue-100/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn EduVi?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Được thiết kế đặc biệt cho giáo viên và nhà giáo dục Việt Nam
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'AI thông minh', desc: 'Tự động tạo nội dung bài giảng từ tài liệu đầu vào của bạn', accent: '#2563eb', bg: '#eff6ff' },
              { icon: Palette, title: 'Thiết kế chuyên nghiệp', desc: 'Hàng trăm mẫu slide đẹp mắt, phù hợp với nhiều môn học', accent: '#7c3aed', bg: '#f5f3ff' },
              { icon: Video, title: 'Tạo video bài giảng', desc: 'Chuyển đổi slide thành video giảng dạy chất lượng cao tự động', accent: '#db2777', bg: '#fdf2f8' },
              { icon: BookOpen, title: 'Kho tài liệu phong phú', desc: 'Thư viện tài liệu giáo dục được đóng góp bởi cộng đồng chuyên gia', accent: '#059669', bg: '#ecfdf5' },
              { icon: BarChart3, title: 'Phân tích chương trình', desc: 'AI phân tích và đánh giá nội dung theo khung chương trình chuẩn', accent: '#ea580c', bg: '#fff7ed' },
              { icon: Globe, title: 'Tiếng Việt hoàn toàn', desc: 'Giao diện và nội dung AI được tối ưu hoàn toàn cho tiếng Việt', accent: '#0891b2', bg: '#ecfeff' },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300 hover:-translate-y-0.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.accent }} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUMBERS BAR — light version */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border-y border-blue-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'Nhiều', label: 'Giáo viên sử dụng', icon: GraduationCap, color: '#2563eb' },
              { value: 'Đa dạng', label: 'Mẫu bài giảng', icon: Layers, color: '#7c3aed' },
              { value: 'Linh hoạt', label: 'Hình thức triển khai', icon: Monitor, color: '#0891b2' },
              { value: 'Tập trung', label: 'Chất lượng giảng dạy', icon: Star, color: '#ea580c' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}10` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 steps */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.32 }} />
        {/* Floating bubbles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { size: 'w-10 h-10', pos: 'top-[15%] right-[8%]', delay: '0s', dur: '8s', opacity: 'opacity-20', color: 'bg-blue-400' },
            { size: 'w-6 h-6',  pos: 'bottom-[20%] left-[5%]', delay: '1.5s', dur: '7s', opacity: 'opacity-20', color: 'bg-indigo-300' },
            { size: 'w-4 h-4',  pos: 'top-[50%] left-[10%]', delay: '0.8s', dur: '9s', opacity: 'opacity-15', color: 'bg-violet-400' },
          ].map((b, i) => (
            <div key={i} className={`absolute ${b.size} ${b.pos} ${b.color} ${b.opacity} rounded-full`} style={{ animation: `floatBubble ${b.dur} ease-in-out infinite`, animationDelay: b.delay }} />
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Bắt đầu chỉ trong 3 bước
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Quy trình đơn giản, không cần kiến thức kỹ thuật
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Tải tài liệu lên',
                desc: 'Upload giáo án, sách giáo khoa hoặc tài liệu tham khảo bất kỳ của bạn.',
                accent: '#2563eb',
                bg: '#eff6ff',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'AI tạo bài giảng',
                desc: 'AI phân tích nội dung và tự động tạo slide, video bài giảng chuyên nghiệp.',
                accent: '#7c3aed',
                bg: '#f5f3ff',
              },
              {
                step: '03',
                icon: Play,
                title: 'Dạy học & chia sẻ',
                desc: 'Chỉnh sửa nếu cần, rồi trình chiếu trực tiếp hoặc xuất file để chia sẻ.',
                accent: '#059669',
                bg: '#ecfdf5',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: item.bg }}
                  >
                    <item.icon className="w-8 h-8" style={{ color: item.accent }} />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: item.accent }}
                  >
                    {item.step}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESKTOP APP SECTION — light version */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-blue-50/40 to-indigo-50/30 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.28 }} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-sm font-medium mb-6">
                <Monitor className="w-4 h-4" />
                Ứng dụng Desktop
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Tải EduVi App
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">cho máy tính của bạn</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-lg">
                Phiên bản desktop chạy game tương tác, thuyết trình slide toàn màn hình và hoạt động offline ngay trên máy tính.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Gamepad2, label: 'Game tương tác', desc: 'MediaPipe qua webcam', color: '#7c3aed', bg: '#f5f3ff' },
                  { icon: Layers, label: 'Slide toàn màn hình', desc: 'Phù hợp màn chiếu', color: '#2563eb', bg: '#eff6ff' },
                  { icon: WifiOff, label: 'Hoạt động offline', desc: 'Không cần internet', color: '#059669', bg: '#ecfdf5' },
                ].map((f) => (
                  <div key={f.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: f.bg }}>
                      <f.icon className="w-4.5 h-4.5" style={{ color: f.color }} />
                    </div>
                    <p className="text-gray-900 text-sm font-semibold">{f.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://github.com/SEP490-EduVi/SEP490_FE/releases/download/v1.0.0/Eduvi-App.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  Tải EduVi Desktop
                </a>
                <Link
                  href="/public/guide"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Xem hướng dẫn
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-400">Windows 10/11 &middot; macOS 12+</p>
            </div>

            {/* Mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl shadow-blue-100/40">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                  <span className="w-3 h-3 rounded-full bg-red-300" />
                  <span className="w-3 h-3 rounded-full bg-amber-300" />
                  <span className="w-3 h-3 rounded-full bg-green-300" />
                  <span className="flex-1 text-center text-xs text-gray-400 font-medium">EduVi Desktop</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-full" />
                  <div className="h-3 bg-gray-100 rounded-lg w-5/6" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-28 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 flex items-center justify-center">
                      <Gamepad2 className="w-9 h-9 text-indigo-300" />
                    </div>
                    <div className="h-28 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 flex items-center justify-center">
                      <Video className="w-9 h-9 text-cyan-300" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-lg w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#f0f5ff]/50 to-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Giáo viên nói gì về EduVi?
            </h2>
            <p className="text-lg text-gray-500">
              Phản hồi từ những người đã sử dụng nền tảng
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: 'EduVi giúp tôi tiết kiệm hàng giờ soạn bài mỗi tuần. Chỉ cần upload tài liệu là có slide đẹp ngay.',
                name: 'Giáo viên Toán',
                school: 'THPT',
                gradient: 'from-blue-50 to-indigo-50',
                border: 'border-blue-100',
              },
              {
                quote: 'Tính năng game tương tác trên Desktop rất hay, học sinh hào hứng hơn hẳn mỗi khi được chơi game bằng camera.',
                name: 'Giáo viên Tiếng Anh',
                school: 'THCS',
                gradient: 'from-violet-50 to-purple-50',
                border: 'border-violet-100',
              },
              {
                quote: 'Giao diện tiếng Việt, dễ dùng, không cần biết kỹ thuật gì cũng tạo được video bài giảng chuyên nghiệp.',
                name: 'Giáo viên Sinh học',
                school: 'THPT',
                gradient: 'from-emerald-50 to-teal-50',
                border: 'border-emerald-100',
              },
            ].map((t, i) => (
              <div key={i} className={`bg-gradient-to-br ${t.gradient} rounded-3xl p-7 border ${t.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/80 border border-white flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #c7d7f4 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/60 p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-100/50 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-100/50 rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Sẵn sàng nâng tầm bài giảng?
              </h2>
              <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
                Tham gia cùng hàng nghìn giáo viên đang sử dụng EduVi để tạo ra những bài giảng ấn tượng.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Đăng ký miễn phí ngay
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  href="/about"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-center hover:shadow-md"
                >
                  Tìm hiểu về EduVi
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
