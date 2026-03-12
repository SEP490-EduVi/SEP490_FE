'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Package,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  File,
  Image as ImageIcon,
  FileVideo,
  ChevronRight,
  Layers,
} from 'lucide-react';

import { useProject } from '@/hooks/useProjectApi';
import { useProducts, useDeleteProduct } from '@/hooks/useProductApi';
import ProductsTab from '@/components/projects/ProductsTab';
import EvaluationModal from '@/components/projects/EvaluationModal';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import type { IDocument } from '@/types/nodes';

// ── Local types (documents don't have an API yet) ──────────────────────────

interface InputDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'image' | 'video';
  fileSize: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'analyzed';
}

type TabKey = 'documents' | 'products';

// ── Helpers ────────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:   { icon: FileText,  color: 'text-red-500 bg-red-50' },
  docx:  { icon: File,      color: 'text-blue-500 bg-blue-50' },
  pptx:  { icon: Layers,    color: 'text-orange-500 bg-orange-50' },
  image: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  video: { icon: FileVideo, color: 'text-purple-500 bg-purple-50' },
};

const DOC_STATUS_CONFIG: Record<InputDocument['status'], { label: string; color: string }> = {
  uploaded:   { label: 'Đã tải lên',  color: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Đang xử lý',  color: 'bg-amber-50 text-amber-600' },
  analyzed:   { label: 'Đã phân tích', color: 'bg-emerald-50 text-emerald-600' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getFileType(name: string): InputDocument['fileType'] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext ?? '')) return 'video';
  return 'pdf';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── API hooks ──────────────────────────────────────────────────────────
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const setDocument = useDocumentStore((state) => state.setDocument);

  // ── Local state ────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<InputDocument[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('documents');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addLocalDocuments(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addLocalDocuments(Array.from(e.target.files));
    }
  };

  const addLocalDocuments = (files: File[]) => {
    const newDocs: InputDocument[] = files.map((file) => ({
      id: `DOC-${String(Date.now()).slice(-4)}`,
      fileName: file.name,
      fileType: getFileType(file.name),
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      status: 'uploaded' as const,
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setShowUploadArea(false);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleDeleteProduct = (productCode: string) => {
    deleteProduct.mutate(productCode);
  };

  const handleViewEvaluation = (productCode: string) => {
    const product = products.find((p) => p.productCode === productCode);
    setEvalProductCode(productCode);
    setEvalProductName(product?.productName);
  };

  const handleViewSlide = async (productCode: string) => {
    try {
      setViewSlideLoading(productCode);
      const detail = await productService.getProductByCode(productCode);
      if (detail.slideDocument) {
        setDocument(detail.slideDocument as unknown as IDocument);
        router.push('/editor');
      }
    } finally {
      setViewSlideLoading(null);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'documents', label: 'Tài liệu đầu vào', icon: FileText, count: documents.length },
    { key: 'products', label: 'Sản phẩm AI', icon: Package, count: products.length },
  ];

  // ── Loading state ───────────────────────────────────────────────────────
  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  // ── Error / Not found state ────────────────────────────────────────────
  if (isProjectError || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy dự án</h2>
        <p className="text-sm text-gray-500 mb-6">Dự án không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button
              onClick={() => router.push('/projects')}
              className="hover:text-blue-600 transition-colors"
            >
              Dự án
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{project.projectName}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push('/projects')}
                className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
                  <span className="text-xs text-gray-400 font-mono">{project.projectCode}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                    project.status === 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {project.status === 0 ? 'Hoạt động' : 'Lưu trữ'}
                  </span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tài liệu', value: documents.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Sản phẩm', value: products.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
            { label: 'Hoàn thành', value: products.filter((p) => p.statusName === 'SLIDES_GENERATED').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'documents' ? (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentsTab
                documents={documents}
                showUploadArea={showUploadArea}
                dragOver={dragOver}
                fileInputRef={fileInputRef}
                onToggleUpload={() => setShowUploadArea(!showUploadArea)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onFileSelect={handleFileSelect}
                onDelete={handleDeleteDocument}
                onClickUpload={() => fileInputRef.current?.click()}
              />
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProductsTab
                products={products}
                isLoading={isProductsLoading}
                onDeleteProduct={handleDeleteProduct}
                onViewSlide={handleViewSlide}
                onViewEvaluation={handleViewEvaluation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Evaluation Modal ── */}
      <EvaluationModal
        open={!!evalProductCode}
        productCode={evalProductCode}
        productName={evalProductName}
        onClose={() => { setEvalProductCode(null); setEvalProductName(undefined); }}
      />

      {/* ── View Slide Loading Overlay ── */}
      {viewSlideLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Đang mở slide...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Documents Tab (local only – no API yet) ────────────────────────────────

function DocumentsTab({
  documents,
  showUploadArea,
  dragOver,
  fileInputRef,
  onToggleUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onDelete,
  onClickUpload,
}: {
  documents: InputDocument[];
  showUploadArea: boolean;
  dragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onToggleUpload: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => void;
  onClickUpload: () => void;
}) {
  return (
    <div>
      {/* Upload Controls */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Tải lên tài liệu bài giảng để AI phân tích và tạo slide tự động.
        </p>
        <button
          onClick={onToggleUpload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Tải tài liệu
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
        onChange={onFileSelect}
        className="hidden"
      />

      {/* Upload Drop Zone */}
      <AnimatePresence>
        {showUploadArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={onClickUpload}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                  dragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-6 h-6 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {dragOver ? 'Thả file vào đây!' : 'Kéo & thả file vào đây'}
                </p>
                <p className="text-xs text-gray-400">
                  Hỗ trợ PDF, Word, PowerPoint, Hình ảnh, Video
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có tài liệu nào</h3>
          <p className="text-sm text-gray-500 mb-4">Hãy tải lên tài liệu bài giảng để bắt đầu!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, idx) => {
            const ftConfig = FILE_TYPE_CONFIG[doc.fileType] ?? FILE_TYPE_CONFIG.pdf;
            const Icon = ftConfig.icon;
            const docStatus = DOC_STATUS_CONFIG[doc.status];
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center gap-4 bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md rounded-xl px-5 py-4 transition-all"
              >
                {/* File icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ftConfig.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{doc.fileSize}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>

                {/* Status */}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${docStatus.color}`}>
                  {docStatus.label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Xem">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Action: Analyze */}
      {documents.length > 0 && (
        <div className="mt-6 flex items-center justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98] transition-all">
            <Sparkles className="w-4 h-4" />
            Phân tích tài liệu với AI
          </button>
        </div>
      )}
    </div>
  );
}


// ── Step Badge ─────────────────────────────────────────────────────────────

function StepBadge({
  done,
  active,
  label,
  icon: Icon,
}: {
  done: boolean;
  active: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
        done
          ? 'bg-emerald-50 text-emerald-600'
          : active
          ? 'bg-blue-50 text-blue-600'
          : 'bg-gray-50 text-gray-400'
      }`}
    >
      {done ? (
        <CheckCircle className="w-3 h-3" />
      ) : active ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {label}
    </span>
  );
}
