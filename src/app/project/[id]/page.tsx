'use client';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { AnalysisView } from '@/components/analysis/AnalysisView';
export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const project = useAppStore(s => s.getProject(params.id as string));
  if (!project) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-4xl mb-3">🔍</div><h2 className="text-brand-navy font-bold text-lg mb-2">Nicht gefunden</h2>
      <button onClick={()=>router.push('/')} className="bg-brand-navy text-white px-5 py-2.5 rounded-lg font-semibold text-sm border-none cursor-pointer">Dashboard</button>
    </div>
  );
  return <AnalysisView project={project} />;
}
