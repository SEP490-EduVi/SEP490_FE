/**
 * Admin – Order Detail (View Only)
 * =================================
 * Shows full order information, user info, package info, and materials list.
 * Admin can ONLY view — no editing to ensure fairness.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingCart,
  User,
  Package,
  Clock,
  FileText,
  Image,
  Video,
  FileAudio,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderDetail {
  id: string;
  orderCode: string;
  // User
  userName: string;
  userEmail: string;
  userRole: string;
  // Package
  packageName: string;
  packagePrice: number;
  usageLimit: number;
  durationDays: number;
  // Payment
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  purchasedAt: string;
  // Materials
  materials: {
    id: string;
    name: string;
    type: 'document' | 'image' | 'video' | 'audio';
    size: string;
    uploadedAt: string;
  }[];
}

// ── Mock data (in real app, fetched by ID) ─────────────────────────────────

const MOCK_DETAIL: Record<string, OrderDetail> = {
  '1': {
    id: '1',
    orderCode: 'ORD-20260227-001',
    userName: 'Nguyen Van A',
    userEmail: 'a@edu.vn',
    userRole: 'teacher',
    packageName: 'Premium',
    packagePrice: 249000,
    usageLimit: 500,
    durationDays: 30,
    amount: 249000,
    paymentMethod: 'Momo',
    status: 'completed',
    purchasedAt: '2026-02-27T09:15:00',
    materials: [
      { id: 'm1', name: 'AI_Intro_Slides.pptx', type: 'document', size: '2.4 MB', uploadedAt: '2026-02-27T09:20:00' },
      { id: 'm2', name: 'neural_network.png', type: 'image', size: '540 KB', uploadedAt: '2026-02-27T09:21:00' },
      { id: 'm3', name: 'demo_video.mp4', type: 'video', size: '15.2 MB', uploadedAt: '2026-02-27T09:25:00' },
      { id: 'm4', name: 'lecture_notes.pdf', type: 'document', size: '1.1 MB', uploadedAt: '2026-02-27T09:30:00' },
      { id: 'm5', name: 'background_music.mp3', type: 'audio', size: '3.8 MB', uploadedAt: '2026-02-27T09:32:00' },
    ],
  },
  '2': {
    id: '2',
    orderCode: 'ORD-20260226-012',
    userName: 'Tran Thi B',
    userEmail: 'b@edu.vn',
    userRole: 'teacher',
    packageName: 'Standard',
    packagePrice: 99000,
    usageLimit: 100,
    durationDays: 30,
    amount: 99000,
    paymentMethod: 'VNPay',
    status: 'completed',
    purchasedAt: '2026-02-26T14:30:00',
    materials: [
      { id: 'm6', name: 'react_basics.pptx', type: 'document', size: '1.8 MB', uploadedAt: '2026-02-26T14:35:00' },
      { id: 'm7', name: 'component_diagram.png', type: 'image', size: '320 KB', uploadedAt: '2026-02-26T14:36:00' },
      { id: 'm8', name: 'hooks_guide.pdf', type: 'document', size: '890 KB', uploadedAt: '2026-02-26T14:40:00' },
    ],
  },
};

// Fallback for IDs not in mock
function getOrderDetail(id: string): OrderDetail | null {
  return MOCK_DETAIL[id] ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_ICON: Record<OrderDetail['status'], React.ReactNode> = {
  completed: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  pending: <Loader2 className="w-5 h-5 text-amber-500" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
  refunded: <RotateCcw className="w-5 h-5 text-gray-500" />,
};

const STATUS_STYLES: Record<OrderDetail['status'], string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<OrderDetail['status'], string> = {
  completed: 'Hoàn tất',
  pending: 'Đang xử lý',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

const MATERIAL_TYPE_LABELS: Record<OrderDetail['materials'][number]['type'], string> = {
  document: 'Tài liệu',
  image: 'Hình ảnh',
  video: 'Video',
  audio: 'Âm thanh',
};

const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="w-4 h-4 text-blue-500" />,
  image: <Image className="w-4 h-4 text-purple-500" />,
  video: <Video className="w-4 h-4 text-pink-500" />,
  audio: <FileAudio className="w-4 h-4 text-amber-500" />,
};

// ── Component ──────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const order = getOrderDetail(orderId);

  if (!order) {
    return (
      <div className="px-8 py-6 max-w-4xl mx-auto">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đơn hàng
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-gray-500">
            Đơn hàng với mã &quot;{orderId}&quot; không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại đơn hàng
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{order.orderCode}</p>
        </div>
        <div className="flex items-center gap-2">
          {STATUS_ICON[order.status]}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Đây là chế độ <strong>chỉ đọc</strong>. Dữ liệu đơn hàng không thể chỉnh sửa.</span>
      </div>

      {/* Info grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* User info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
            <User className="w-4 h-4 text-gray-400" />
            Thông tin người dùng
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Tên</dt>
              <dd className="font-medium text-gray-900">{order.userName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-700">{order.userEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Vai trò</dt>
              <dd className="text-gray-700 capitalize">{order.userRole === 'teacher' ? 'Giáo viên' : order.userRole}</dd>
            </div>
          </dl>
        </div>

        {/* Package info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
            <Package className="w-4 h-4 text-gray-400" />
            Thông tin gói
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Gói</dt>
              <dd className="font-medium text-gray-900">{order.packageName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Giá</dt>
              <dd className="text-gray-700">{formatVND(order.packagePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Giới hạn sử dụng</dt>
              <dd className="text-gray-700">{order.usageLimit} lượt tạo</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Thời hạn</dt>
              <dd className="text-gray-700">{order.durationDays} ngày</dd>
            </div>
          </dl>
        </div>

        {/* Payment info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            Thông tin thanh toán
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Số tiền</dt>
              <dd className="font-bold text-gray-900 text-lg">{formatVND(order.amount)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Phương thức thanh toán</dt>
              <dd className="font-medium text-gray-900">{order.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Trạng thái</dt>
              <dd>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Thời gian mua</dt>
              <dd className="flex items-center gap-1 text-gray-700">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatDateTime(order.purchasedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Materials list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Tài liệu ({order.materials.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Các tệp người dùng tải lên cho đơn hàng này
          </p>
        </div>

        {order.materials.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            Chưa có tài liệu nào được tải lên.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {order.materials.map((mat) => (
              <li
                key={mat.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {MATERIAL_ICONS[mat.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {mat.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {MATERIAL_TYPE_LABELS[mat.type]} &middot; {mat.size}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(mat.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
