'use client';

export function MetadataSelect({
  label,
  value,
  onChange,
  options,
  isLoading,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
  isLoading: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50"
      >
        <option value="">-- Chọn --</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}
