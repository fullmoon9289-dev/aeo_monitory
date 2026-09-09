'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, Bell, Bot, Check, ChevronDown, CircleHelp, Clock3, Eye, FileText, Hospital, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const visibilityData = [
  { day: '8/12', score: 42 }, { day: '8/16', score: 46 }, { day: '8/20', score: 44 },
  { day: '8/24', score: 55 }, { day: '8/28', score: 61 }, { day: '9/1', score: 64 },
  { day: '9/5', score: 72 }, { day: '9/9', score: 78 },
];
const chartConfig = { score: { label: 'AEO 점수', color: '#6957e8' } } satisfies ChartConfig;
const channels = [
  { name: 'ChatGPT', score: 84, change: '+12', color: 'bg-[#10a37f]' },
  { name: 'Perplexity', score: 72, change: '+8', color: 'bg-[#20808d]' },
  { name: 'Google AI', score: 61, change: '+4', color: 'bg-[#4285f4]' },
  { name: 'Claude', score: 54, change: '+6', color: 'bg-[#d97757]' },
];
const keywords = [
  { keyword: '강남 허리디스크 비수술 치료', intent: '병원 선택', volume: '2.4K', gap: 92, rank: '미노출' },
  { keyword: '허리 주사치료 통증 얼마나', intent: '치료 정보', volume: '1.8K', gap: 86, rank: '9위' },
  { keyword: '도수치료 실비 적용 기준', intent: '비용·보험', volume: '3.1K', gap: 81, rank: '7위' },
  { keyword: '목디스크 초기증상 자가진단', intent: '증상 확인', volume: '5.6K', gap: 77, rank: '4위' },
];
const contentItems = [
  { title: '허리디스크, 수술 없이 좋아질 수 있나요?', status: '발행 완료', date: '9월 8일', score: 94 },
  { title: '도수치료 실비보험 적용, 2026년 기준 정리', status: '검토 필요', date: '오늘', score: 87 },
  { title: '목디스크 초기증상 7가지와 병원 방문 시점', status: '작성 중', date: '2시간 전', score: 76 },
];
const navItems = [
  { id: 'dashboard', label: '대시보드', icon: BarChart3 },
  { id: 'keywords', label: '키워드 기회', icon: Search, badge: 12 },
  { id: 'content', label: '콘텐츠', icon: FileText },
  { id: 'monitor', label: 'AI 모니터링', icon: Bot },
];

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => Promise<Record<string, unknown>>;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

export default function Home() {
  const [active, setActive] = useState('dashboard');
  const [period, setPeriod] = useState('최근 30일');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = context.registerTool({
      name: 'start_content_draft',
      title: 'AEO 콘텐츠 초안 시작',
      description: '선택한 병원 검색 키워드로 AEO 콘텐츠 초안을 시작하고 콘텐츠 화면으로 이동합니다.',
      inputSchema: {
        type: 'object',
        properties: { keyword: { type: 'string', minLength: 2 } },
        required: ['keyword'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const keyword = typeof input === 'object' && input !== null && 'keyword' in input
          ? String((input as { keyword: unknown }).keyword).trim()
          : '';
        if (keyword.length < 2) throw new Error('keyword는 두 글자 이상이어야 합니다.');
        setGenerated(true);
        setActive('content');
        return { status: 'draft_started', keyword, view: 'content' };
      },
    }, { signal: lifecycle.signal });
    Promise.resolve(register).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-[#20202a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] border-r border-[#e8e7ee] bg-white lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center gap-3 border-b border-[#efedf4] px-6">
          <div className="grid size-9 place-items-center rounded-xl bg-[#6957e8] text-white shadow-[0_6px_18px_rgba(105,87,232,.28)]"><Activity className="size-[19px]" strokeWidth={2.4} /></div>
          <div><div className="text-[15px] font-bold tracking-[-.02em]">MediAnswer</div><div className="text-[10px] font-semibold tracking-[.12em] text-[#94909f]">AEO PLATFORM</div></div>
        </div>
        <div className="p-4">
          <button className="flex w-full items-center gap-3 rounded-xl border border-[#e9e7ef] bg-[#fbfafe] px-3 py-2.5 text-left transition hover:border-[#d8d2fb]">
            <div className="grid size-8 place-items-center rounded-lg bg-[#e9f3ff] text-[#397ac5]"><Hospital className="size-4" /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">서울바른척추병원</div><div className="mt-0.5 text-[10px] text-[#9b98a6]">정형외과 · 강남구</div></div><ChevronDown className="size-3.5 text-[#9793a3]" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-2" aria-label="주요 메뉴">
          <div className="mb-2 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">OVERVIEW</div>
          <div className="space-y-1">{navItems.map((item) => { const Icon = item.icon; return (
            <button key={item.id} onClick={() => setActive(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === item.id ? 'bg-[#f0edff] text-[#5a47d5]' : 'text-[#666371] hover:bg-[#f7f6fa] hover:text-[#2f2d38]'}`}><Icon className="size-[17px]" /><span className="flex-1 text-left">{item.label}</span>{item.badge && <span className="rounded-full bg-[#6957e8] px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>}</button>
          ); })}</div>
          <div className="mb-2 mt-7 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">MANAGE</div>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#666371] hover:bg-[#f7f6fa]"><Settings className="size-[17px]" /> 설정</button>
        </nav>
        <div className="m-4 rounded-2xl bg-[#252331] p-4 text-white"><div className="mb-3 flex items-center justify-between"><Sparkles className="size-4 text-[#b9adff]" /><Badge className="bg-white/10 text-[9px] text-white">PRO</Badge></div><div className="text-xs font-semibold">이번 달 콘텐츠</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-[#9d8cff]" /></div><div className="mt-2 text-[10px] text-white/60">17 / 25개 생성</div></div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-[#e8e7ee] bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden"><div className="grid size-8 place-items-center rounded-lg bg-[#6957e8] text-white"><Activity className="size-4" /></div><span className="font-bold">MediAnswer</span></div>
          <div className="ml-auto flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="도움말"><CircleHelp className="size-[18px] text-[#777381]" /></Button><Button variant="ghost" size="icon" aria-label="알림" className="relative"><Bell className="size-[18px] text-[#777381]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#f05d62] ring-2 ring-white" /></Button><div className="mx-1 h-6 w-px bg-[#e9e7ef]" /><button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[#f7f6fa]"><div className="grid size-8 place-items-center rounded-full bg-[#dceaff] text-xs font-bold text-[#3769a3]">김</div><span className="hidden text-xs font-semibold sm:block">김지현</span><ChevronDown className="size-3.5 text-[#9a96a4]" /></button></div>
        </header>

        <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#8c8997]"><span>서울바른척추병원</span><span>·</span><span>{navItems.find((item) => item.id === active)?.label}</span></div><h1 className="text-[26px] font-bold tracking-[-.035em] sm:text-[30px]">AI 검색에서 우리 병원은 잘 보일까요?</h1><p className="mt-2 text-sm text-[#777381]">오늘의 AEO 현황과 가장 먼저 잡아야 할 콘텐츠 기회를 확인하세요.</p></div>
            <div className="flex items-center gap-2"><button onClick={() => setPeriod(period === '최근 30일' ? '최근 7일' : '최근 30일')} className="flex h-9 items-center gap-2 rounded-lg border border-[#dfdde6] bg-white px-3 text-xs font-medium text-[#5d5a67] shadow-sm">{period}<ChevronDown className="size-3.5" /></button><Button onClick={() => { setGenerated(true); setActive('content'); }} className="h-9 rounded-lg bg-[#6957e8] px-4 hover:bg-[#5845d5]"><Sparkles className="size-4" /> 콘텐츠 만들기</Button></div>
          </div>

          <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="핵심 지표">
            {[
              { label: 'AEO 종합 점수', value: '78', unit: '/ 100', change: '+14.2%', icon: Target, tone: 'purple' },
              { label: 'AI 답변 노출률', value: '64', unit: '%', change: '+8.7%', icon: Eye, tone: 'blue' },
              { label: '브랜드 언급', value: '186', unit: '회', change: '+23.1%', icon: Bot, tone: 'green' },
              { label: '발견한 키워드', value: '42', unit: '개', change: '+12개', icon: Search, tone: 'orange' },
            ].map((metric) => { const Icon = metric.icon; const colors: Record<string, string> = { purple: 'bg-[#efecff] text-[#6653df]', blue: 'bg-[#eaf4ff] text-[#397fd1]', green: 'bg-[#e8f7f1] text-[#218462]', orange: 'bg-[#fff1e6] text-[#d77832]' }; return (
              <div key={metric.label} className="rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-[0_2px_10px_rgba(31,28,45,.025)]"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#7e7a89]">{metric.label}</span><span className={`grid size-8 place-items-center rounded-lg ${colors[metric.tone]}`}><Icon className="size-4" /></span></div><div className="mt-4 flex items-end gap-1.5"><span className="text-[30px] font-bold leading-none tracking-[-.04em]">{metric.value}</span><span className="mb-0.5 text-xs text-[#9c98a6]">{metric.unit}</span></div><div className="mt-3 flex items-center gap-1 text-[11px]"><TrendingUp className="size-3 text-[#258967]" /><span className="font-semibold text-[#258967]">{metric.change}</span><span className="text-[#a19da9]">지난 기간 대비</span></div></div>
            ); })}
          </section>

          <section className="mb-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-[15px] font-bold">AI 검색 가시성 추이</h2><p className="mt-1 text-xs text-[#9692a0]">주요 AI 검색엔진에서 측정한 종합 노출 점수</p></div><button className="rounded-lg p-1.5 text-[#aaa6b1] hover:bg-[#f5f3f8]"><MoreHorizontal className="size-4" /></button></div><ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto"><AreaChart data={visibilityData} margin={{ left: 0, right: 6, top: 8, bottom: 0 }}><defs><linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.28}/><stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.015}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 4" /><XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} /><Area dataKey="score" type="monotone" fill="url(#fillScore)" stroke="var(--color-score)" strokeWidth={2.5} dot={false} /></AreaChart></ChartContainer></div>
            <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-[15px] font-bold">AI 채널별 노출</h2><p className="mt-1 text-xs text-[#9692a0]">100개 질문 테스트 기준</p></div><div className="space-y-[19px]">{channels.map((channel) => <div key={channel.name}><div className="mb-2 flex items-center justify-between text-xs"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${channel.color}`} /><span className="font-semibold">{channel.name}</span></div><div><span className="font-bold">{channel.score}%</span><span className="ml-2 text-[10px] font-semibold text-[#258967]">{channel.change}</span></div></div><div className="h-1.5 overflow-hidden rounded-full bg-[#efedf3]"><div className={`h-full rounded-full ${channel.color}`} style={{ width: `${channel.score}%` }} /></div></div>)}</div></div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white"><div className="flex items-center justify-between border-b border-[#efedf3] px-5 py-4 sm:px-6"><div><h2 className="text-[15px] font-bold">지금 잡아야 할 키워드</h2><p className="mt-1 text-xs text-[#9692a0]">검색 수요는 높고 AI 답변 경쟁은 낮은 기회</p></div><button onClick={() => setActive('keywords')} className="flex items-center gap-1 text-xs font-semibold text-[#6957e8]">전체 보기 <ArrowUpRight className="size-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[#fbfafe] text-[10px] font-semibold uppercase tracking-[.06em] text-[#9995a2]"><tr><th className="px-6 py-3">추천 키워드</th><th className="px-3 py-3">검색 의도</th><th className="px-3 py-3">월 검색량</th><th className="px-3 py-3">기회 점수</th><th className="px-6 py-3"></th></tr></thead><tbody className="divide-y divide-[#f0eef4]">{keywords.map((item) => <tr key={item.keyword} className="group hover:bg-[#fcfbff]"><td className="px-6 py-3.5 font-semibold">{item.keyword}<div className="mt-1 text-[10px] font-normal text-[#a09ca8]">현재 {item.rank}</div></td><td className="px-3 py-3.5"><span className="rounded-md bg-[#f1eff6] px-2 py-1 text-[10px] font-medium text-[#6c6875]">{item.intent}</span></td><td className="px-3 py-3.5 font-semibold">{item.volume}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><span className="font-bold text-[#5f4dd2]">{item.gap}</span><div className="h-1 w-12 rounded-full bg-[#eeeaf9]"><div className="h-full rounded-full bg-[#7562e8]" style={{width: `${item.gap}%`}} /></div></div></td><td className="px-6 py-3.5 text-right"><Button onClick={() => { setGenerated(true); setActive('content'); }} variant="outline" size="sm" className="text-[11px]"><Plus className="size-3"/> 글 만들기</Button></td></tr>)}</tbody></table></div></div>
            <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-[15px] font-bold">콘텐츠 진행 상황</h2><p className="mt-1 text-xs text-[#9692a0]">이번 주 자동 생성 콘텐츠</p></div><div className="grid size-8 place-items-center rounded-lg bg-[#fff4dd] text-[#ce8c21]"><Zap className="size-4" /></div></div>{generated && <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#d8d1ff] bg-[#f5f2ff] p-3 text-xs font-semibold text-[#5c49d1]"><Check className="size-4" /> 새 초안이 생성되었습니다.</div>}<div className="space-y-4">{contentItems.map((item, index) => <div key={item.title} className="flex gap-3"><div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${index === 0 ? 'bg-[#e9f7f0] text-[#278363]' : index === 1 ? 'bg-[#fff4e5] text-[#d48628]' : 'bg-[#efecff] text-[#6957e8]'}`}>{index === 0 ? <Check className="size-3.5" /> : index === 1 ? <Clock3 className="size-3.5" /> : <Sparkles className="size-3.5" />}</div><div className="min-w-0 flex-1"><div className="line-clamp-1 text-xs font-semibold leading-5">{item.title}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[#9d99a5]"><span>{item.status}</span><span>·</span><span>{item.date}</span><span className="ml-auto font-bold text-[#6c58df]">AEO {item.score}</span></div></div></div>)}</div><button onClick={() => setActive('content')} className="mt-5 w-full rounded-xl border border-[#e6e3ec] py-2.5 text-xs font-semibold text-[#615d69] transition hover:border-[#d7d0fb] hover:bg-[#faf9ff]">콘텐츠 캘린더 열기</button></div>
          </section>
        </main>
      </div>
    </div>
  );
}
