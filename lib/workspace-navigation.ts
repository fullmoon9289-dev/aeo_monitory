import { Activity, BarChart3, Bot, FileDown, FileText, Map, Search, Sparkles } from 'lucide-react';

export type WorkspaceView = 'command' | 'performance' | 'journey' | 'opportunities' | 'studio' | 'monitor' | 'report' | 'search-console' | 'knowledge' | 'settings';
export function workflowNavigation(opportunityCount: number, baselineCount?: number) {
  return [
    { id: 'command', label: '온보딩 센터', icon: Activity },
    { id: 'performance', label: 'AI 노출 성과', icon: BarChart3 },
    { id: 'journey', label: '환자 질문 지도', icon: Map },
    { id: 'opportunities', label: '성장 기회', icon: Sparkles, badge: opportunityCount },
    { id: 'studio', label: '콘텐츠 스튜디오', icon: FileText },
    { id: 'monitor', label: '노출 기준선', icon: Bot, badge: baselineCount },
    { id: 'report', label: 'PDF 진단 보고서', icon: FileDown },
    { id: 'search-console', label: '서치콘솔 분석', icon: Search },
  ] as const;
}
