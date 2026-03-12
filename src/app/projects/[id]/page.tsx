'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  FileText,
  Package,
  Upload,
  Trash2,
  Edit3,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  Download,
  File,
  Image as ImageIcon,
  FileVideo,
  X,
  ChevronRight,
  BookOpen,
  Layers,
  BarChart3,
  Pencil,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface InputDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'image' | 'video';
  fileSize: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'analyzed';
}

interface Product {
  productCode: string;
  name: string;
  status: 'new' | 'evaluating' | 'evaluated' | 'generating' | 'completed' | 'failed';
  slidesCount: number;
  createdAt: string;
  updatedAt: string;
  hasEvaluation: boolean;
  hasSlide: boolean;
  hasEditedSlide: boolean;
}

type TabKey = 'documents' | 'products';

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROJECT = {
  projectCode: 'PRJ-001',
  name: 'Toán Đại số lớp 10',
  description: 'Bài giảng về phương trình bậc hai, hệ phương trình và bất phương trình. Dành cho học sinh THPT theo chương trình giáo dục mới.',
  subject: 'Toán học',
  grade: 'Lớp 10',
  createdAt: '2026-03-01',
  updatedAt: '2026-03-10',
  status: 'active' as const,
};

const MOCK_DOCUMENTS: InputDocument[] = [
  {
    id: 'DOC-001',
    fileName: 'Chuong_3_Phuong_trinh_bac_hai.pdf',
    fileType: 'pdf',
    fileSize: '2.4 MB',
    uploadedAt: '2026-03-01',
    status: 'analyzed',
  },
  {
    id: 'DOC-002',
    fileName: 'Bai_tap_he_phuong_trinh.docx',
    fileType: 'docx',
    fileSize: '1.1 MB',
    uploadedAt: '2026-03-03',
    status: 'analyzed',
  },
  {
    id: 'DOC-003',
    fileName: 'Bat_phuong_trinh_bac_nhat.pptx',
    fileType: 'pptx',
    fileSize: '5.7 MB',
    uploadedAt: '2026-03-08',
    status: 'uploaded',
  },
];

const MOCK_PRODUCTS: Product[] = [
  {
    productCode: 'PROD-001',
    name: 'Slide: Phương trình bậc hai',
    status: 'completed',
    slidesCount: 15,
    createdAt: '2026-03-02',
    updatedAt: '2026-03-09',
    hasEvaluation: true,
    hasSlide: true,
    hasEditedSlide: true,
  },
  {
    productCode: 'PROD-002',
    name: 'Slide: Hệ phương trình bậc nhất',
    status: 'evaluated',
    slidesCount: 0,
    createdAt: '2026-03-05',
    updatedAt: '2026-03-08',
    hasEvaluation: true,
    hasSlide: false,
    hasEditedSlide: false,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:   { icon: FileText,  color: 'text-red-500 bg-red-50' },
  docx:  { icon: File,      color: 'text-blue-500 bg-blue-50' },
  pptx:  { icon: Layers,    color: 'text-orange-500 bg-orange-50' },
  image: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  video: { icon: FileVideo, color: 'text-purple-500 bg-purple-50' },
};

const STATUS_CONFIG: Record<Product['status'], { label: string; color: string; icon: React.ElementType }> = {
  new:        { label: 'Mới tạo',      color: 'bg-gray-100 text-gray-600',    icon: Clock },
  evaluating: { label: 'Đang đánh giá', color: 'bg-blue-50 text-blue-600',    icon: Loader2 },
  evaluated:  { label: 'Đã đánh giá',  color: 'bg-cyan-50 text-cyan-600',     icon: BarChart3 },
  generating: { label: 'Đang tạo slide', color: 'bg-amber-50 text-amber-600', icon: Loader2 },
  completed:  { label: 'Hoàn thành',   color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
  failed:     { label: 'Thất bại',     color: 'bg-red-50 text-red-600',       icon: AlertCircle },
};

const DOC_STATUS_CONFIG: Record<InputDocument['status'], { label: string; color: string }> = {
  uploaded:   { label: 'Đã tải lên',  color: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Đang xử lý',  color: 'bg-amber-50 text-amber-600' },
  analyzed:   { label: 'Đã phân tích', color: 'bg-emerald-50 text-emerald-600' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project] = useState(MOCK_PROJECT);
  const [documents, setDocuments] = useState<InputDocument[]>(MOCK_DOCUMENTS);
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [activeTab, setActiveTab] = useState<TabKey>('documents');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addMockDocuments(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addMockDocuments(Array.from(e.target.files));
    }
  };

  const addMockDocuments = (files: File[]) => {
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

  const getFileType = (name: string): InputDocument['fileType'] => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'pptx' || ext === 'ppt') return 'pptx';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext ?? '')) return 'video';
    return 'pdf';
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'documents', label: 'Tài liệu đầu vào', icon: FileText, count: documents.length },
    { key: 'products', label: 'Sản phẩm AI', icon: Package, count: products.length },
  ];

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
            <span className="text-gray-900 font-medium">{project.name}</span>
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
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                    {project.subject}
                  </span>
                  <span className="text-xs text-gray-400">{project.grade}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">{project.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-colors">
                <Edit3 className="w-4 h-4" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tài liệu', value: documents.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Sản phẩm', value: products.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
            { label: 'Hoàn thành', value: products.filter((p) => p.status === 'completed').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Ngày tạo', value: formatDate(project.createdAt), icon: Calendar, color: 'text-amber-600 bg-amber-50' },
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
              <ProductsTab products={products} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Documents Tab ──────────────────────────────────────────────────────────

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

// ── Products Tab ───────────────────────────────────────────────────────────

function ProductsTab({ products }: { products: Product[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Các sản phẩm slide được AI tạo ra từ tài liệu bài giảng.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có sản phẩm nào</h3>
          <p className="text-sm text-gray-500">Hãy tải tài liệu lên và phân tích để tạo sản phẩm.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, idx) => {
            const statusConfig = STATUS_CONFIG[product.status];
            const StatusIcon = statusConfig.icon;
            const isSpinning = product.status === 'evaluating' || product.status === 'generating';

            return (
              <motion.div
                key={product.productCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg rounded-2xl p-5 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{product.name}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tạo lúc {formatDate(product.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Cập nhật {formatDate(product.updatedAt)}
                      </span>
                      {product.slidesCount > 0 && (
                        <span>{product.slidesCount} slide</span>
                      )}
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center gap-2">
                      <StepBadge
                        done={product.hasEvaluation}
                        active={product.status === 'evaluating'}
                        label="Đánh giá"
                        icon={BarChart3}
                      />
                      <div className="w-6 h-px bg-gray-200" />
                      <StepBadge
                        done={product.hasSlide}
                        active={product.status === 'generating'}
                        label="Tạo slide"
                        icon={Layers}
                      />
                      <div className="w-6 h-px bg-gray-200" />
                      <StepBadge
                        done={product.hasEditedSlide}
                        active={false}
                        label="Chỉnh sửa"
                        icon={Pencil}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {product.hasEvaluation && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Xem đánh giá
                      </button>
                    )}
                    {product.hasSlide && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Xem slide
                      </button>
                    )}
                    {product.status === 'evaluated' && !product.hasSlide && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md rounded-lg transition-all">
                        <Sparkles className="w-3.5 h-3.5" />
                        Tạo slide
                      </button>
                    )}
                    {product.hasSlide && !product.hasEditedSlide && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </button>
                    )}
                    {product.hasEditedSlide && (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Xuất file
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
