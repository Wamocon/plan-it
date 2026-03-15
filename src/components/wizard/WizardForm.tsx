'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { wizardSteps } from '@/lib/wizard-steps';
import { useAppStore } from '@/stores/appStore';
import { WizardData } from '@/types';
import { SmartSelect } from '@/components/ui/SmartSelect';
import { MultiSelect } from '@/components/ui/MultiSelect';

export function WizardForm() {
  const router = useRouter();
  const addProject = useAppStore(s => s.addProject);
  const updateAnalysis = useAppStore(s => s.updateAnalysis);
  const setAiPending = useAppStore(s => s.setAiPending);
  const setAiFailReason = useAppStore(s => s.setAiFailReason);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({});

  const current = wizardSteps[step];
  const visibleFields = current.fields.filter(f => !f.showWhen || f.showWhen(data));
  const filled = visibleFields.every(f => {
    if (f.type === 'multi') return (data[f.key] || '').split(',').filter(Boolean).length > 0;
    const v = data[f.key]; if (!v) return false;
    if (v === '_c' && f.customKey) return !!data[f.customKey]; return true;
  });
  const isLast = step === wizardSteps.length - 1;
  const update = (key: string, value: string) => setData(prev => ({ ...prev, [key]: value }));

  const handleNext = async () => {
    if (!filled) return;
    if (!isLast) { setStep(step + 1); return; }

    const { fallbackAnalysis } = await import('@/lib/fallback-analysis');
    const project = addProject(data, fallbackAnalysis(data));
    setAiPending(project.id, true);
    router.push(`/project/${project.id}`);

    fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) })
      .then(res => {
        if (res.status === 429) { setAiFailReason(project.id, 'limit'); return null; }
        if (!res.ok) { setAiFailReason(project.id, 'error'); return null; }
        return res.json();
      })
      .then(analysis => { if (analysis?.risks) updateAnalysis(project.id, { ...analysis, source: 'ai' }); })
      .catch(() => setAiFailReason(project.id, 'error'))
      .finally(() => setAiPending(project.id, false));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-7">
      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-7">
        {wizardSteps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => i <= step && setStep(i)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i === step
                  ? 'bg-[#ff1a1a] border-[#ff1a1a] text-white shadow-[0_0_12px_rgba(255,26,26,0.4)]'
                  : i < step
                  ? 'bg-[#22aa66] border-[#22aa66] text-white'
                  : 'bg-white/5 border-white/10 text-white/30'
              } ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}>
              {i < step ? '✓' : i + 1}
            </button>
            {i < wizardSteps.length - 1 && (
              <div className={`w-6 h-0.5 ${i < step ? 'bg-[#22aa66]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-0.5">{current.icon} {current.title}</h2>
      <p className="text-white/40 text-sm mb-5">Schritt {step + 1} von {wizardSteps.length}</p>

      {visibleFields.map(field => {
        if (field.type === 'text') return (
          <div key={field.key} className="mb-4">
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">{field.label}</label>
            <input
              value={data[field.key] || ''}
              onChange={e => update(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 rounded-lg text-sm" />
          </div>
        );
        if (field.type === 'multi') return (
          <MultiSelect key={field.key} label={field.label} options={field.options || []}
            selected={(data[field.key] || '').split(',').filter(Boolean)}
            onChange={arr => update(field.key, arr.join(','))}
            customValue={data[field.key + 'C'] || ''}
            onCustomChange={v => update(field.key + 'C', v)} />
        );
        if (field.allowCustom && field.customKey) return (
          <SmartSelect key={field.key} label={field.label} value={data[field.key] || ''}
            customValue={data[field.customKey] || ''} options={field.options || []}
            onChange={v => update(field.key, v)} onCustomChange={v => update(field.customKey!, v)} />
        );
        return (
          <div key={field.key} className="mb-4">
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">{field.label}</label>
            <select
              value={data[field.key] || ''}
              onChange={e => update(field.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm">
              <option value="">Bitte wählen...</option>
              {field.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        );
      })}

      <div className="flex justify-between mt-7">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.push('/')}
          className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/70 font-semibold text-sm cursor-pointer hover:bg-white/10 transition-colors">
          ← {step === 0 ? 'Abbrechen' : 'Zurück'}
        </button>
        <button
          onClick={handleNext}
          disabled={!filled}
          className={`px-5 py-2.5 rounded-lg border-none text-white font-semibold text-sm transition-all ${
            isLast
              ? 'bg-[#22aa66] shadow-[0_4px_18px_rgba(34,170,102,0.25)]'
              : 'bg-[#ff1a1a] shadow-[0_4px_18px_rgba(255,26,26,0.25)]'
          } ${filled ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}>
          {isLast ? '📊 Analyse starten' : 'Weiter →'}
        </button>
      </div>
    </div>
  );
}
