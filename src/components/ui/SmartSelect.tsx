'use client';

interface SmartSelectProps {
  label: string;
  value: string;
  customValue: string;
  options: [string, string][];
  onChange: (value: string) => void;
  onCustomChange: (value: string) => void;
}

export function SmartSelect({ label, value, customValue, options, onChange, onCustomChange }: SmartSelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm">
        <option value="">Bitte wählen...</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {value === '_c' && (
        <input value={customValue} onChange={e => onCustomChange(e.target.value)}
          placeholder="Bitte beschreiben..."
          className="w-full mt-2 px-3 py-2.5 rounded-lg text-sm border border-[rgba(255,26,26,0.3)]"
          style={{ background: 'rgba(255,26,26,0.06)' }}
          autoFocus />
      )}
    </div>
  );
}
