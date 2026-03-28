'use client';

/**
 * Trang Chủ EduVi
 * ===============
 * 
 * Trang bắt đầu để lựa chọn giữa:
 * 1. Trình chỉnh sửa Prompt - Tạo bài thuyết trình bằng AI (giống Gamma)
 * 2. Trình chỉnh sửa Slide - Chỉnh sửa slide trực tiếp bằng kéo thả
 * 
 * Workflow:
 * Trang chủ → Trình Prompt → Tạo nội dung → Trình Slide
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Zap,
  ArrowRight,
  CheckCircle,
  Palette,
  ImagePlus,
  Edit3,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
  const router = useRouter();
  const { user, role, isHydrated, hydrate, logout } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleGoDashboard = () => {
    if (role === 'admin') {
      router.push('/admin');
      return;
    }
    if (role === 'teacher') {
      router.push('/teacher');
      return;
    }
    if (role === 'expert') {
      router.push('/expert');
      return;
    }
    router.push('/');
  };

  const handleLogout = () => {
    queryClient.clear();
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduVi</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button 
            onClick={() => router.push('/expert/certificate')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Trợ giúp
            </button>

            {isHydrated && user ? (
              <>
                <button
                  onClick={handleGoDashboard}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Trang của tôi
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Đăng ký
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Tạo bài thuyết trình và video cùng AI
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chọn cách bắt đầu: dùng AI để tạo nội dung hoặc vào chỉnh sửa ngay
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Prompt Editor Option */}
            <div
              onClick={() => router.push('/projects')}
              className="group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Trình Chỉnh Sửa Prompt AI
              </h3>
              <p className="text-gray-600 mb-4">
                Mô tả điều bạn muốn tạo và để AI sinh ra bố cục bài thuyết trình hoàn chỉnh
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Bắt đầu với AI</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Đề xuất cho người mới bắt đầu</span>
                </div>
              </div>
            </div>

            {/* Slide Editor Option */}
            <div
              onClick={() => router.push('/Test')}
              className="group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-purple-500"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Trình Chỉnh Sửa Slide
              </h3>
              <p className="text-gray-600 mb-4">
                Vào chỉnh sửa ngay với trình kéo thả mạnh mẽ và thư viện tài nguyên
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Bắt đầu chỉnh sửa</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Toàn quyền kiểm soát thiết kế</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Được hỗ trợ bởi AI</h4>
              <p className="text-sm text-gray-600">Tạo nội dung bằng prompt thông minh</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Kéo và thả</h4>
              <p className="text-sm text-gray-600">Trình chỉnh sửa trực quan, dễ dùng</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImagePlus className="w-6 h-6 text-pink-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Nội dung đa phương tiện</h4>
              <p className="text-sm text-gray-600">Thêm video, PDF, biểu đồ và nhiều hơn nữa</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 EduVi. Tạo bài thuyết trình đẹp cùng AI.</p>
      </footer>
    </div>
  );
}
