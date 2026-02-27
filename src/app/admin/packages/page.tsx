/**
 * Admin – Package Management
 * ==========================
 * Manage pricing plans: edit price, usage limits, toggle active/inactive.
 */

'use client';

import React, { useState } from 'react';
import {
  Package,
  Pencil,
  X,
  Check,
  Plus,
  Zap,
  Crown,
  Star,
  Trash2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface PricingPackage {
  id: string;
  name: string;
  description: string;
  price: number;          // VND
  usageLimit: number;     // number of AI generations
  durationDays: number;   // validity period
  isActive: boolean;
  subscriberCount: number;
  icon: 'zap' | 'star' | 'crown';
}

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_PACKAGES: PricingPackage[] = [
  {
    id: 'pkg-1',
    name: 'Free',
    description: 'Truy cập cơ bản với số lượt tạo AI giới hạn',
    price: 0,
    usageLimit: 10,
    durationDays: 30,
    isActive: true,
    subscriberCount: 842,
    icon: 'zap',
  },
  {
    id: 'pkg-2',
    name: 'Standard',
    description: 'Dành cho giáo viên và người tạo nội dung thường xuyên',
    price: 99000,
    usageLimit: 100,
    durationDays: 30,
    isActive: true,
    subscriberCount: 316,
    icon: 'star',
  },
  {
    id: 'pkg-3',
    name: 'Premium',
    description: 'Truy cập không giới hạn cho người dùng chuyên nghiệp và tổ chức',
    price: 249000,
    usageLimit: 500,
    durationDays: 30,
    isActive: true,
    subscriberCount: 90,
    icon: 'crown',
  },
  {
    id: 'pkg-4',
    name: 'Enterprise',
    description: 'Gói tùy chỉnh cho các tổ chức lớn',
    price: 999000,
    usageLimit: 9999,
    durationDays: 365,
    isActive: false,
    subscriberCount: 0,
    icon: 'crown',
  },
];

const ICON_MAP = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const ICON_COLOR_MAP = {
  zap: { bg: 'bg-gray-100', text: 'text-gray-600' },
  star: { bg: 'bg-blue-50', text: 'text-blue-600' },
  crown: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PricingPackage[]>(INITIAL_PACKAGES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    price: number;
    usageLimit: number;
    durationDays: number;
  }>({ price: 0, usageLimit: 0, durationDays: 30 });

  // Start editing a package
  const startEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setEditForm({
      price: pkg.price,
      usageLimit: pkg.usageLimit,
      durationDays: pkg.durationDays,
    });
  };

  // Save edited package
  const saveEdit = () => {
    if (!editingId) return;
    setPackages((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? { ...p, price: editForm.price, usageLimit: editForm.usageLimit, durationDays: editForm.durationDays }
          : p
      )
    );
    setEditingId(null);
  };

  // Toggle active/inactive
  const toggleActive = (id: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  // Delete package
  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const totalSubscribers = packages.reduce((s, p) => s + p.subscriberCount, 0);

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gói cước</h1>
          <p className="text-sm text-gray-500 mt-1">
            {packages.length} gói &middot; {totalSubscribers.toLocaleString()} người đăng ký
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Thêm gói
        </button>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => {
          const isEditing = editingId === pkg.id;
          const IconComponent = ICON_MAP[pkg.icon];
          const iconColors = ICON_COLOR_MAP[pkg.icon];

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-xl border p-6 transition-shadow hover:shadow-sm ${
                pkg.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors.bg}`}>
                    <IconComponent className={`w-5 h-5 ${iconColors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <p className="text-xs text-gray-500">{pkg.description}</p>
                  </div>
                </div>

                {/* Status toggle */}
                <button
                  onClick={() => toggleActive(pkg.id)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    pkg.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {pkg.isActive ? 'Hoạt động' : 'Ngừng'}
                </button>
              </div>

              {/* Stats */}
              {isEditing ? (
                /* ── Edit Form ── */
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Giá (VND)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Giới hạn sử dụng
                      </label>
                      <input
                        type="number"
                        value={editForm.usageLimit}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            usageLimit: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Thời hạn (ngày)
                      </label>
                      <input
                        type="number"
                        value={editForm.durationDays}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            durationDays: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Edit actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Display ── */
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {pkg.price === 0 ? 'Miễn phí' : formatVND(pkg.price)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{pkg.usageLimit.toLocaleString()} lượt tạo</span>
                    <span className="text-gray-300">|</span>
                    <span>{pkg.durationDays} ngày</span>
                    <span className="text-gray-300">|</span>
                    <span>{pkg.subscriberCount} người đăng ký</span>
                  </div>
                </div>
              )}

              {/* Action buttons (only show when not editing) */}
              {!isEditing && (
                <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => startEdit(pkg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => deletePackage(pkg.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
