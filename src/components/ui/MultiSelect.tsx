'use client';
import { useState } from 'react';

interface MultiSelectProps {
  label: string;
  options: [string, string][];
  selected: string[];
  onChange: (selected: string[]) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
}

export function MultiSelect({ label, options, selected, onChange, customValue, onCustomChange }: MultiSelectProps) {
  const hasCustom = selected.includes('_c');

  const toggle = (val: string) => {
    if (val === 'none') { onChange(['none']); return; }
    let next = selected.filter(v => v !== 'none');
    if (next.includes(val)) next = next.filter(v => v !== val);
    else next.push(val);
    onChange(next);
  };

  const removeChip = (val: string) => {
    onChange(selected.filter(v => v !== val));
    if (val === '_c' && onCustomChange) onCustomChange('');
  };

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="border border-white/10 rounded-lg p-2 bg-[#1c1010] min-h-[38px]">
        {/* Chips */}
        {selected.filter(v => v !== '_c').length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selected.filter(v => v !== '_c').map(val => {
              const opt = options.find(o => o[0] === val);
              return (
                <span key={val} className="bg-[#ff1a1a]/15 text-[#ff6b6b] px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-[#ff1a1a]/20">
                  {opt ? opt[1] : val}
                  <button onClick={() => removeChip(val)} className="text-white/30 hover:text-[#ff1a1a] text-xs leading-none transition-colors">×</button>
                </span>
              );
            })}
            {hasCustom && customValue && (
              <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-purple-500/20">
                {customValue}
                <button onClick={() => removeChip('_c')} className="text-white/30 hover:text-[#ff1a1a] text-xs leading-none transition-colors">×</button>
              </span>
            )}
          </div>
        )}
        {/* Options */}
        <div className="flex flex-wrap gap-1">
          {options.map(([val, lbl]) => (
            <button key={val} onClick={() => toggle(val)} type="button"
              className={`px-2.5 py-1 rounded-md border text-xs cursor-pointer transition-all ${
                selected.includes(val)
                  ? 'bg-[#ff1a1a]/20 text-[#ff6b6b] border-[#ff1a1a]/40'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-[#ff1a1a]/30 hover:text-white/80'
              }`}>{lbl}</button>
          ))}
          <button onClick={() => toggle('_c')} type="button"
            className={`px-2.5 py-1 rounded-md border border-dashed text-xs cursor-pointer transition-all ${
              hasCustom
                ? 'bg-purple-900/40 text-purple-300 border-purple-500/40'
                : 'text-white/30 border-white/15 hover:border-purple-500/40 hover:text-white/60'
            }`}>+ Andere...</button>
        </div>
        {/* Custom input */}
        {hasCustom && (
          <input value={customValue || ''} onChange={e => onCustomChange?.(e.target.value)}
            placeholder="Eigenen Wert eingeben..."
            className="w-full mt-2 px-3 py-2 rounded-lg text-sm border border-purple-500/30"
            style={{ background: 'rgba(139,92,246,0.08)' }}
            autoFocus />
        )}
      </div>
    </div>
  );
}
