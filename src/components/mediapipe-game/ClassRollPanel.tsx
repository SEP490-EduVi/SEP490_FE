'use client';

import React from 'react';
import { X, Upload, Dices, RotateCcw, ChevronLeft, Users, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useClassrooms } from '@/hooks/useClassroomApi';
import type { ClassroomDto } from '@/services/classroomServices';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Student = { stt: number; name: string };
type View = 'setup' | 'spin';

type Props = { onClose: () => void };

// â”€â”€ Slot machine constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ITEM_H    = 84;   // px â€” height of each slot row
const VISIBLE   = 5;    // number of visible rows (must be odd)
const PAD       = Math.floor(VISIBLE / 2); // rows of padding above/below winner
const SPIN_CNT  = 30;   // random rows to spin through before landing
const ANIM_MS   = 2800; // total spin duration

// Winner ends at index PAD + SPIN_CNT in the generated sequence
const WINNER_IDX = PAD + SPIN_CNT;
// translateY to place winner in center of window
const TARGET_Y   = -(WINNER_IDX - PAD) * ITEM_H; // = -SPIN_CNT * ITEM_H

function buildSequence(students: Student[], winner: Student): Student[] {
  const r = () => students[Math.floor(Math.random() * students.length)];
  return [
    ...Array.from({ length: PAD }, r),
    ...Array.from({ length: SPIN_CNT }, r),
    winner,
    ...Array.from({ length: PAD }, r),
  ];
}

// â”€â”€ Excel parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseExcel(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const students: Student[] = [];
        for (const row of rows) {
          const stt  = row.find((v) => typeof v === 'number' && Number.isInteger(v) && (v as number) > 0);
          const name = row.find((v) => typeof v === 'string' && (v as string).trim().length > 1);
          if (stt !== undefined && name !== undefined)
            students.push({ stt: stt as number, name: (name as string).trim() });
        }
        resolve(students);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

// â”€â”€ Slot drum component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SlotDrum({ sequence, translateY, spinning }: { sequence: Student[]; translateY: number; spinning: boolean }) {
  const windowH = ITEM_H * VISIBLE;
  const centerTop = ITEM_H * PAD;

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        height: windowH,
        borderRadius: 20,
        background: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)',
        border: '2px solid #c4b5fd',
        boxShadow: 'inset 0 2px 12px rgba(109,40,217,0.15)',
      }}
    >
      {/* Top fade mask */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: centerTop, background: 'linear-gradient(to bottom, rgba(245,243,255,0.97) 0%, rgba(245,243,255,0) 100%)' }}
      />
      {/* Bottom fade mask */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: centerTop, background: 'linear-gradient(to top, rgba(245,243,255,0.97) 0%, rgba(245,243,255,0) 100%)' }}
      />
      {/* Center selection stripe */}
      <div
        className="absolute inset-x-0 z-5 pointer-events-none"
        style={{
          top: centerTop,
          height: ITEM_H,
          background: 'rgba(124,58,237,0.1)',
          borderTop: '2px solid rgba(124,58,237,0.45)',
          borderBottom: '2px solid rgba(124,58,237,0.45)',
        }}
      />
      {/* Left & right edge accents on center row */}
      <div className="absolute z-10 pointer-events-none flex items-center justify-between px-3 inset-x-0"
        style={{ top: centerTop, height: ITEM_H }}>
        <span style={{ fontSize: 18, color: 'rgba(124,58,237,0.6)' }}>&#x25B6;</span>
        <span style={{ fontSize: 18, color: 'rgba(124,58,237,0.6)' }}>&#x25C0;</span>
      </div>

      {/* The scrolling strip of numbers */}
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          transition: spinning ? `transform ${ANIM_MS}ms cubic-bezier(0.12, 0.0, 0.19, 1.0)` : 'none',
          willChange: 'transform',
        }}
      >
        {sequence.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ height: ITEM_H }}
          >
            <span
              className="font-black tabular-nums select-none"
              style={{ fontSize: 60, lineHeight: 1, color: '#4c1d95', letterSpacing: '-2px' }}
            >
              {item.stt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ClassRollPanel({ onClose }: Props) {
  // â”€â”€ Setup view state
  const [students,   setStudents]   = React.useState<Student[]>([]);
  const [fileName,   setFileName]   = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  // ── API source state
  const [sourceTab, setSourceTab] = React.useState<'excel' | 'api'>('excel');
  const [selectedClassroomCode, setSelectedClassroomCode] = React.useState<string | null>(null);
  const { data: classrooms = [], isLoading: classroomsLoading } = useClassrooms();
  // â”€â”€ Spin view state
  const [view,        setView]        = React.useState<View>('setup');
  const [sequence,    setSequence]    = React.useState<Student[]>([]);
  const [translateY,  setTranslateY]  = React.useState(0);
  const [spinning,    setSpinning]    = React.useState(false);
  const [winner,      setWinner]      = React.useState<Student | null>(null);
  const [showWinner,  setShowWinner]  = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // â”€â”€ File handling
  const handleFile = async (file: File) => {
    setParseError(null);
    setStudents([]);
    setFileName(file.name);
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) {
        setParseError('Không tìm thấy học sinh nào. File cần có cột số thứ tự (số nguyên) và cột tên.');
        setFileName(null);
        return;
      }
      setStudents(parsed);
    } catch {
      setParseError('Lỗi đọc file. Hãy dùng file Excel (.xlsx / .xls).');
      setFileName(null);
    }
  };
  // ── Apply classroom students from API
  const applyClassroom = (cls: ClassroomDto) => {
    const mapped: Student[] = cls.students.map((name, i) => ({ stt: i + 1, name }));
    setStudents(mapped);
    setSelectedClassroomCode(cls.studentListCode);
    setFileName(null);
    setParseError(null);
  };
  // â”€â”€ Start spinning
  const startRoll = () => {
    if (students.length === 0) return;

    const picked = students[Math.floor(Math.random() * students.length)];
    const seq    = buildSequence(students, picked);

    setWinner(picked);
    setSequence(seq);
    setTranslateY(0);   // reset to top (no transition)
    setSpinning(false);
    setShowWinner(false);
    setView('spin');

    // Need two rAF ticks so the DOM paints translateY=0 before we apply the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTranslateY(TARGET_Y);
        setSpinning(true);
      });
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSpinning(false);
      setShowWinner(true);
    }, ANIM_MS + 120);
  };

  const rollAgain = () => {
    setShowWinner(false);
    setWinner(null);
    // Small delay so the old winner card fades before re-spin
    setTimeout(startRoll, 80);
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative h-full flex flex-col overflow-hidden"
        style={{
          width: 'clamp(320px, 35vw, 460px)',
          background: '#ffffff',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* â”€â”€ Header â”€â”€ */}
        <div
          className="shrink-0 flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: '#e5e7eb' }}
        >
          {view === 'spin' && (
            <button
              type="button"
              onClick={() => setView('setup')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors -ml-1 mr-0.5"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe' }}>
            <Dices size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-tight">Quay số ngẫu nhiên</p>
            <p className="text-gray-400 text-xs mt-0.5 truncate">
              {students.length > 0 ? `${students.length} học sinh` : 'Chưa có danh sách lớp'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ VIEW: SETUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'setup' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

              {/* Source tab switcher */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
                <button
                  type="button"
                  onClick={() => setSourceTab('excel')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    sourceTab === 'excel' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Import Excel
                </button>
                <button
                  type="button"
                  onClick={() => setSourceTab('api')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    sourceTab === 'api' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chọn từ lớp học
                </button>
              </div>

              {/* Upload zone (Excel tab) */}
              {sourceTab === 'excel' && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Danh sách lớp (Excel)</p>
                  <div
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center gap-2.5 px-5 transition-colors hover:border-purple-400 hover:bg-purple-50"
                    style={{
                      paddingTop: fileName ? 16 : 32,
                      paddingBottom: fileName ? 16 : 32,
                      borderColor: fileName ? '#a78bfa' : '#d1d5db',
                      background:  fileName ? '#faf5ff' : '#fafafa',
                    }}
                  >
                    <div
                      className="rounded-2xl flex items-center justify-center"
                      style={{
                        width: fileName ? 36 : 48,
                        height: fileName ? 36 : 48,
                        background: fileName ? '#ede9fe' : '#f3f4f6',
                      }}
                    >
                      <Upload size={fileName ? 16 : 20} className={fileName ? 'text-purple-500' : 'text-gray-400'} />
                    </div>
                    {fileName ? (
                      <div className="text-center">
                        <p className="font-semibold text-purple-700 text-sm">{fileName}</p>
                        <p className="text-purple-400 text-xs">{students.length} học sinh · Nhấn để đổi file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-semibold text-gray-600 text-sm">Kéo file vào đây hoặc nhấn để chọn</p>
                        <p className="text-gray-400 text-xs mt-1">Hỗ trợ .xlsx, .xls · Cột số thứ tự + họ tên</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef} type="file" accept=".xlsx,.xls" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                  />
                  {parseError && <p className="mt-2 text-xs text-red-500 leading-relaxed">{parseError}</p>}
                </div>
              )}

              {/* Classroom picker (API tab) */}
              {sourceTab === 'api' && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chọn lớp học</p>
                  {classroomsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    </div>
                  ) : classrooms.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">
                      <Users size={28} className="mx-auto mb-2 opacity-30" />
                      Chưa có lớp học nào.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classrooms.map((cls) => (
                        <button
                          key={cls.studentListCode}
                          type="button"
                          onClick={() => applyClassroom(cls)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            selectedClassroomCode === cls.studentListCode
                              ? 'border-purple-400 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: selectedClassroomCode === cls.studentListCode ? '#ede9fe' : '#f3f4f6' }}
                          >
                            <Users size={14} className={selectedClassroomCode === cls.studentListCode ? 'text-purple-600' : 'text-gray-400'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{cls.description}</p>
                            <p className="text-xs text-gray-400">{cls.studentCount} học sinh</p>
                          </div>
                          {selectedClassroomCode === cls.studentListCode && (
                            <Check size={14} className="text-purple-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Student list (shared) */}
              {students.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Danh sách ({students.length} học sinh)
                  </p>
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#e5e7eb' }}>
                    {students.map((s, i) => (
                      <div
                        key={s.stt}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                        style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: '#ede9fe', color: '#7c3aed' }}
                        >
                          {s.stt}
                        </span>
                        <span className="text-gray-700 truncate">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t" style={{ borderColor: '#e5e7eb' }}>
              <button
                type="button"
                onClick={startRoll}
                disabled={students.length === 0}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: students.length > 0 ? '0 4px 18px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                <Dices size={16} />
                Quay số ngẫu nhiên
              </button>
              <button
                type="button" onClick={onClose}
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                × Đóng
              </button>
            </div>
          </>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ VIEW: SPIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {view === 'spin' && (
          <>
            <div className="flex-1 flex flex-col justify-center gap-6 px-6 py-6 overflow-hidden">

              {/* Label */}
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {spinning ? 'Đang quay...' : showWinner ? 'Kết quả!' : 'Sẵn sàng'}
                </p>
              </div>

              {/* Slot drum */}
              {sequence.length > 0 && (
                <SlotDrum sequence={sequence} translateY={translateY} spinning={spinning} />
              )}

              {/* Winner card â€” appears after spinning stops */}
              <div
                style={{
                  opacity: showWinner ? 1 : 0,
                  transform: showWinner ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  pointerEvents: showWinner ? 'auto' : 'none',
                }}
              >
                {winner && (
                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
                    }}
                  >
                    <p className="text-purple-300 text-xs font-semibold tracking-wider uppercase mb-2">
                      🎯 Học sinh được chọn
                    </p>
                    <p
                      className="font-black tabular-nums"
                      style={{ fontSize: 52, lineHeight: 1, color: '#ffffff', letterSpacing: '-2px' }}
                    >
                      #{winner.stt}
                    </p>
                    <p className="text-white font-bold text-xl mt-2 leading-tight">{winner.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t space-y-2" style={{ borderColor: '#e5e7eb' }}>
              <button
                type="button"
                onClick={rollAgain}
                disabled={spinning}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
                }}
              >
                <RotateCcw size={15} />
                Quay lại
              </button>
              <button
                type="button" onClick={() => setView('setup')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ← Xem danh sách
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
