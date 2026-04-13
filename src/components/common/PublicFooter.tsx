import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EduVi</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nền tảng tạo bài giảng thông minh bằng AI. Giúp giáo viên tiết kiệm thời gian và nâng cao chất lượng giảng dạy.
            </p>
          </div>

          {/* Sản phẩm */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Sản phẩm</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Tạo bài giảng AI</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Trình chỉnh sửa Slide</Link></li>
              <li><Link href="/subscription" className="hover:text-white transition-colors">Bảng giá</Link></li>
            </ul>
          </div>

          {/* Công ty */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Công ty</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link href="/subscription" className="hover:text-white transition-colors">Bảng giá</Link></li>
              <li><Link href="/policy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Liên hệ</h4>
            <ul className="space-y-2.5 text-sm">
              <li>Email: pdat1746@gmail.com</li>
              <li>Hotline: 1900-xxxx</li>
              <li>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-gray-800" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} EduVi. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <Link href="/policy" className="hover:text-gray-300 transition-colors">Điều khoản sử dụng</Link>
            <Link href="/policy" className="hover:text-gray-300 transition-colors">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
