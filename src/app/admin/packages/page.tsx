'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Power, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/admin/Pagination';
import { notify, MSGS } from '@/components/common';
import { adminServices } from '@/services/adminServices';
import { CreatePlanRequest, PagedResponse, PlanResponse, UpdatePlanRequest } from '@/types/admin';

interface PlanFormState {
  planName: string;
  description: string;
  price: string;
  analysisQuotaAmount: string;
  slideQuotaAmount: string;
  videoQuotaAmount: string;
  gameQuotaAmount: string;
}

const DEFAULT_FORM: PlanFormState = {
  planName: '',
  description: '',
  price: '0',
  analysisQuotaAmount: '0',
  slideQuotaAmount: '0',
  videoQuotaAmount: '0',
  gameQuotaAmount: '0',
};

const PAGE_SIZE = 10;
const MAX_INT_QUOTA = 2147483647;

const normalizePlanListResult = (result: PlanResponse[] | PagedResponse<PlanResponse>) => {
  if (Array.isArray(result)) {
    return {
      data: result,
      total: result.length,
      page: 1,
      pageSize: result.length || PAGE_SIZE,
    };
  }

  const rows = result.data ?? result.items ?? [];
  return {
    data: rows,
    total: result.total ?? result.totalItems ?? rows.length,
    page: result.page ?? result.currentPage ?? 1,
    pageSize: result.pageSize ?? result.size ?? PAGE_SIZE,
  };
};

const formatEduCoin = (value: number) => `${value.toLocaleString('vi-VN')} EduCoin`;
const formatQuota = (value: number) => (value >= MAX_INT_QUOTA ? 'Không giới hạn' : value.toLocaleString('vi-VN'));

const isValidPlanName = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 5) return false;
  if (!/[A-Za-zÀ-ỹ]/.test(trimmed)) return false;
  return /^[A-Za-zÀ-ỹ0-9\s\-_,.()]+$/.test(trimmed);
};

export default function AdminPlansPage() {
  const [items, setItems] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string>('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<PlanFormState>(DEFAULT_FORM);

  const [deletingPlan, setDeletingPlan] = useState<PlanResponse | null>(null);
  const [togglingPlan, setTogglingPlan] = useState<PlanResponse | null>(null);

  const loadPlans = async (targetPage = page) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await adminServices.listPlans({ page: targetPage, pageSize: PAGE_SIZE });
      const normalized = normalizePlanListResult(res.result);
      setItems(normalized.data);
      setTotal(normalized.total);
      setPage(normalized.page || targetPage);
      setPageSize(normalized.pageSize || PAGE_SIZE);
    } catch (err) {
      setFetchError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể tải danh sách gói cước.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans(1);
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (plan: PlanResponse) => {
    setEditingPlan(plan);
    setForm({
      planName: plan.planName,
      description: plan.description ?? '',
      price: String(plan.price),
      analysisQuotaAmount: String(plan.analysisQuotaAmount),
      slideQuotaAmount: String(plan.slideQuotaAmount),
      videoQuotaAmount: String(plan.videoQuotaAmount),
      gameQuotaAmount: String(plan.gameQuotaAmount),
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const validateForm = (): string => {
    if (!isValidPlanName(form.planName)) {
      return 'Tên gói phải có ít nhất 5 ký tự, có chữ cái và không chứa ký tự đặc biệt bất thường.';
    }

    if (!form.description.trim()) return 'Mô tả là bắt buộc.';

    const price = Number(form.price);
    const analysisQuotaAmount = Number(form.analysisQuotaAmount);
    const slideQuotaAmount = Number(form.slideQuotaAmount);
    const videoQuotaAmount = Number(form.videoQuotaAmount);
    const gameQuotaAmount = Number(form.gameQuotaAmount);

    if (!Number.isFinite(price) || price < 0) return 'Giá EduCoin không được âm.';
    if (!Number.isFinite(analysisQuotaAmount) || analysisQuotaAmount < 0) return 'Quota AI không được âm.';
    if (!Number.isFinite(slideQuotaAmount) || slideQuotaAmount < 0) return 'Quota Slide không được âm.';
    if (!Number.isFinite(videoQuotaAmount) || videoQuotaAmount < 0) return 'Quota Video không được âm.';
    if (!Number.isFinite(gameQuotaAmount) || gameQuotaAmount < 0) return 'Quota Game không được âm.';

    if (
      analysisQuotaAmount > MAX_INT_QUOTA ||
      slideQuotaAmount > MAX_INT_QUOTA ||
      videoQuotaAmount > MAX_INT_QUOTA ||
      gameQuotaAmount > MAX_INT_QUOTA
    ) {
      return `Quota không được vượt quá ${MAX_INT_QUOTA.toLocaleString('vi-VN')}.`;
    }

    return '';
  };

  const handleSavePlan = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const price = Number(form.price);
      const analysisQuotaAmount = Number(form.analysisQuotaAmount);
      const slideQuotaAmount = Number(form.slideQuotaAmount);
      const videoQuotaAmount = Number(form.videoQuotaAmount);
      const gameQuotaAmount = Number(form.gameQuotaAmount);

      if (editingPlan) {
        const payload: UpdatePlanRequest = {
          planName: form.planName.trim(),
          description: form.description.trim() || undefined,
          price,
          analysisQuotaAmount,
          slideQuotaAmount,
          videoQuotaAmount,
          gameQuotaAmount,
        };
        await adminServices.updatePlan(editingPlan.planId, payload);
        notify.success(MSGS.plan.updateSuccess);
      } else {
        const payload: CreatePlanRequest = {
          planName: form.planName.trim(),
          description: form.description.trim() || undefined,
          price,
          analysisQuotaAmount,
          slideQuotaAmount,
          videoQuotaAmount,
          gameQuotaAmount,
        };
        await adminServices.createPlan(payload);
        notify.success(MSGS.plan.createSuccess);
      }

      setIsFormOpen(false);
      await loadPlans(page);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? MSGS.plan.saveError;
      setFormError(msg);
      notify.error(MSGS.plan.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;

    setSubmitting(true);
    try {
      await adminServices.softDeletePlan(deletingPlan.planId);
      notify.success(MSGS.plan.deleteSuccess(deletingPlan.planName));
      setDeletingPlan(null);
      await loadPlans(page);
    } catch (err) {
      notify.error(MSGS.plan.deleteError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePlanStatus = async () => {
    if (!togglingPlan) return;

    setSubmitting(true);
    try {
      await adminServices.updatePlan(togglingPlan.planId, { isActive: !togglingPlan.isActive });
      notify.success(
        togglingPlan.isActive
          ? MSGS.plan.toggleInactive(togglingPlan.planName)
          : MSGS.plan.toggleActive(togglingPlan.planName),
      );
      setTogglingPlan(null);
      await loadPlans(page);
    } catch {
      notify.error(MSGS.plan.toggleStatusError);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const active = items.filter((p) => p.isActive).length;
    return { active, inactive: items.length - active };
  }, [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý gói cước</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tổng {total} gói, {summary.active} hoạt động, {summary.inactive} ngưng hoạt động
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Thêm gói
        </button>
      </div>

      {fetchError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{fetchError}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-left font-medium text-gray-500">Tên gói</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Giá (EduCoin)</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Quota (AI / Slide / Video / Game)</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                    Chưa có gói cước nào.
                  </td>
                </tr>
              ) : (
                items.map((plan) => (
                  <tr key={plan.planId} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{plan.planName}</p>
                      <p className="text-xs text-gray-400">{plan.description || 'Không có mô tả'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatEduCoin(plan.price)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      <p>AI: {formatQuota(plan.analysisQuotaAmount)}</p>
                      <p>Slide: {formatQuota(plan.slideQuotaAmount)}</p>
                      <p>Video: {formatQuota(plan.videoQuotaAmount)}</p>
                      <p>Game: {formatQuota(plan.gameQuotaAmount)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {plan.isActive ? 'Hoạt động' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setTogglingPlan(plan)}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium ${
                            plan.isActive
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" /> {plan.isActive ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(plan)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPlan(plan)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage) => {
            setPage(nextPage);
            void loadPlans(nextPage);
          }}
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          if (!submitting) setIsFormOpen(false);
        }}
        title={editingPlan ? 'Cập nhật gói cước' : 'Tạo gói cước'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang xử lý...' : editingPlan ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên gói</label>
            <input
              type="text"
              value={form.planName}
              onChange={(e) => setForm((prev) => ({ ...prev, planName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="min-w-0">
              <label className="mb-1 flex h-8 items-end text-xs font-medium text-gray-700">Giá (EduCoin)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 flex h-8 items-end text-xs font-medium text-gray-700">Quota AI</label>
              <input
                type="number"
                min={0}
                value={form.analysisQuotaAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, analysisQuotaAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 flex h-8 items-end text-xs font-medium text-gray-700">Quota Slide</label>
              <input
                type="number"
                min={0}
                value={form.slideQuotaAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, slideQuotaAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 flex h-8 items-end text-xs font-medium text-gray-700">Quota Video</label>
              <input
                type="number"
                min={0}
                value={form.videoQuotaAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, videoQuotaAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 flex h-8 items-end text-xs font-medium text-gray-700">Quota Game</label>
              <input
                type="number"
                min={0}
                value={form.gameQuotaAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, gameQuotaAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Xem trước gói cước</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{form.planName.trim() || 'Tên gói'}</p>
            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{form.description.trim() || 'Mô tả gói cước sẽ hiển thị ở đây.'}</p>
            <p className="mt-3 text-xl font-extrabold text-blue-700">
              {Number.isFinite(Number(form.price)) ? formatEduCoin(Math.max(0, Number(form.price))) : formatEduCoin(0)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-4">
              <p>AI: {Number.isFinite(Number(form.analysisQuotaAmount)) ? formatQuota(Math.max(0, Number(form.analysisQuotaAmount))) : '0'}</p>
              <p>Slide: {Number.isFinite(Number(form.slideQuotaAmount)) ? formatQuota(Math.max(0, Number(form.slideQuotaAmount))) : '0'}</p>
              <p>Video: {Number.isFinite(Number(form.videoQuotaAmount)) ? formatQuota(Math.max(0, Number(form.videoQuotaAmount))) : '0'}</p>
              <p>Game: {Number.isFinite(Number(form.gameQuotaAmount)) ? formatQuota(Math.max(0, Number(form.gameQuotaAmount))) : '0'}</p>
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingPlan}
        onClose={() => {
          if (!submitting) setDeletingPlan(null);
        }}
        title="Xác nhận xóa gói"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingPlan(null)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeletePlan}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Hành động này sẽ soft-delete và đặt <strong>isActive = false</strong> cho gói cước{' '}
          <strong>{deletingPlan?.planName}</strong>.
        </p>
      </Modal>

      <Modal
        isOpen={!!togglingPlan}
        onClose={() => {
          if (!submitting) setTogglingPlan(null);
        }}
        title="Xác nhận đổi trạng thái"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setTogglingPlan(null)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleTogglePlanStatus}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {togglingPlan?.isActive
            ? <>Bạn muốn ngưng hoạt động gói <strong>{togglingPlan?.planName}</strong>?</>
            : <>Bạn muốn kích hoạt gói <strong>{togglingPlan?.planName}</strong>?</>}
        </p>
      </Modal>
    </div>
  );
}
