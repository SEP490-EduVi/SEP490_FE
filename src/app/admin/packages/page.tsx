'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Pagination from '@/components/admin/Pagination';
import StatusToast from '@/components/admin/StatusToast';
import { adminServices } from '@/services/adminServices';
import { CreatePlanRequest, PagedResponse, PlanResponse, UpdatePlanRequest } from '@/types/admin';

type ToastState = {
  kind: 'success' | 'error';
  message: string;
} | null;

interface PlanFormState {
  planName: string;
  description: string;
  durationDays: string;
  price: string;
  quotaAmount: string;
}

const DEFAULT_FORM: PlanFormState = {
  planName: '',
  description: '',
  durationDays: '30',
  price: '0',
  quotaAmount: '0',
};

const PAGE_SIZE = 10;

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

const formatVND = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export default function AdminPlansPage() {
  const [items, setItems] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string>('');
  const [toast, setToast] = useState<ToastState>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<PlanFormState>(DEFAULT_FORM);

  const [deletingPlan, setDeletingPlan] = useState<PlanResponse | null>(null);

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
      setFetchError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Khong the tai danh sach goi cuoc.');
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
      durationDays: String(plan.durationDays),
      price: String(plan.price),
      quotaAmount: String(plan.quotaAmount),
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const validateForm = (): string => {
    if (!form.planName.trim()) return 'Ten goi la bat buoc.';

    const durationDays = Number(form.durationDays);
    const price = Number(form.price);
    const quotaAmount = Number(form.quotaAmount);

    if (!Number.isFinite(durationDays) || durationDays <= 0) return 'durationDays phai > 0.';
    if (!Number.isFinite(price) || price < 0) return 'price phai >= 0.';
    if (!Number.isFinite(quotaAmount) || quotaAmount < 0) return 'quotaAmount phai >= 0.';

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
      const durationDays = Number(form.durationDays);
      const price = Number(form.price);
      const quotaAmount = Number(form.quotaAmount);

      if (editingPlan) {
        const payload: UpdatePlanRequest = {
          planName: form.planName.trim(),
          description: form.description.trim() || undefined,
          durationDays,
          price,
          quotaAmount,
        };
        await adminServices.updatePlan(editingPlan.planId, payload);
        setToast({ kind: 'success', message: 'Cap nhat goi cuoc thanh cong.' });
      } else {
        const payload: CreatePlanRequest = {
          planName: form.planName.trim(),
          description: form.description.trim() || undefined,
          durationDays,
          price,
          quotaAmount,
        };
        await adminServices.createPlan(payload);
        setToast({ kind: 'success', message: 'Tao goi cuoc thanh cong.' });
      }

      setIsFormOpen(false);
      await loadPlans(page);
    } catch (err) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Khong the luu goi cuoc.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;

    setSubmitting(true);
    try {
      await adminServices.softDeletePlan(deletingPlan.planId);
      setToast({ kind: 'success', message: `Da ngung kich hoat goi ${deletingPlan.planName}.` });
      setDeletingPlan(null);
      await loadPlans(page);
    } catch (err) {
      setToast({
        kind: 'error',
        message:
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Khong the xoa goi cuoc.',
      });
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
      {toast && <StatusToast kind={toast.kind} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan ly goi cuoc</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tong {total} goi, {summary.active} hoat dong, {summary.inactive} ngung hoat dong
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Them goi
        </button>
      </div>

      {fetchError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{fetchError}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-left font-medium text-gray-500">Ten goi</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Gia</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Han su dung</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Quota</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Trang thai</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Hanh dong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                    Chua co goi cuoc nao.
                  </td>
                </tr>
              ) : (
                items.map((plan) => (
                  <tr key={plan.planId} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{plan.planName}</p>
                      <p className="text-xs text-gray-400">{plan.description || 'Khong co mo ta'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatVND(plan.price)}</td>
                    <td className="px-5 py-3 text-gray-600">{plan.durationDays} ngay</td>
                    <td className="px-5 py-3 text-gray-600">{plan.quotaAmount.toLocaleString('vi-VN')}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {plan.isActive ? 'Hoat dong' : 'Ngung'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(plan)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Sua
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPlan(plan)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xoa
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
        title={editingPlan ? 'Cap nhat goi cuoc' : 'Tao goi cuoc'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Dang xu ly...' : editingPlan ? 'Luu thay doi' : 'Tao moi'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ten goi</label>
            <input
              type="text"
              value={form.planName}
              onChange={(e) => setForm((prev) => ({ ...prev, planName: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mo ta</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">durationDays</label>
              <input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">price</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">quotaAmount</label>
              <input
                type="number"
                min={0}
                value={form.quotaAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, quotaAmount: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
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
        title="Xac nhan xoa goi"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingPlan(null)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={handleDeletePlan}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Dang xu ly...' : 'Xac nhan'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Hanh dong nay se soft-delete va dat <strong>isActive = false</strong> cho goi cuoc{' '}
          <strong>{deletingPlan?.planName}</strong>.
        </p>
      </Modal>
    </div>
  );
}
