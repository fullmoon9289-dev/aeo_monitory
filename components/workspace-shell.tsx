'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Activity, Bell, CircleHelp, Menu, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClinicSwitcher } from '@/components/clinic-workspace';

export type WorkspaceNavItem<T extends string> = { id: T; label: string; icon: LucideIcon; badge?: number };

export function WorkspaceShell<T extends string>({ active, onSelect, workflowItems, hospitalItems, status, sidebarFooter, onHelp, onAlerts, children }: {
  active: T;
  onSelect: (view: T) => void;
  workflowItems: readonly WorkspaceNavItem<T>[];
  hospitalItems: readonly WorkspaceNavItem<T>[];
  status: string;
  sidebarFooter: ReactNode;
  onHelp: () => void;
  onAlerts: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobileOpen]);

  function select(view: T) { onSelect(view); setMobileOpen(false); }
  function items(entries: readonly WorkspaceNavItem<T>[]) {
    return entries.map(({ id, label, icon: Icon, badge }) => <button
      key={id} type="button" onClick={() => select(id)} aria-current={active === id ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === id ? 'bg-[#f0edff] text-[#5946d4]' : 'text-[#666371] hover:bg-[#f7f6fa] hover:text-[#2f2d38]'}`}>
      <Icon className="size-[17px] shrink-0" /><span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && <span className="rounded-full bg-[#6957e8] px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
    </button>);
  }

  return <div className="min-h-screen bg-[#f7f7fa] text-[#20202a]">
    {mobileOpen && <button type="button" aria-label="메뉴 닫기" className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[#e8e7ee] bg-white ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'} lg:visible lg:translate-x-0`}>
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#efedf4] px-6">
        <div className="grid size-9 place-items-center rounded-xl bg-[#6957e8] text-white shadow-[0_6px_18px_rgba(105,87,232,.28)]"><Activity className="size-[19px]" strokeWidth={2.4} /></div>
        <div className="flex-1"><div className="text-[15px] font-bold tracking-[-.02em]">MediAnswer</div><div className="text-[9px] font-bold tracking-[.12em] text-[#94909f]">HOSPITAL AEO OS</div></div>
        <button type="button" className="p-1 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="메뉴 닫기"><X className="size-4" /></button>
      </div>
      <div className="shrink-0 p-4"><ClinicSwitcher /></div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="주요 메뉴">
        <div className="mb-2 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">AEO WORKFLOW</div>
        <div className="space-y-1">{items(workflowItems)}</div>
        <div className="mb-2 mt-7 px-3 text-[10px] font-semibold tracking-[.1em] text-[#a6a2af]">HOSPITAL</div>
        <div className="space-y-1">{items(hospitalItems)}</div>
        <div className="my-5 rounded-2xl bg-[#252331] p-4 text-white">{sidebarFooter}</div>
      </nav>
    </aside>
    <div className="min-w-0 lg:pl-[248px]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#e8e7ee] bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-9">
        <button type="button" onClick={() => setMobileOpen(true)} className="mr-3 rounded-lg p-2 lg:hidden" aria-label="메뉴 열기" aria-expanded={mobileOpen}><Menu className="size-5" /></button>
        <div className="hidden min-w-0 items-center gap-2 pr-3 text-xs text-[#777381] sm:flex"><span className="size-2 shrink-0 rounded-full bg-[#2cad77] shadow-[0_0_0_4px_#e5f7ef]" /><span>{status}</span></div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="도움말 및 연결 설정" onClick={onHelp} className="hidden sm:inline-flex"><CircleHelp className="size-[18px] text-[#777381]" /></Button>
          <Button variant="ghost" size="icon" aria-label="검수 항목 보기" onClick={onAlerts} className="hidden sm:inline-flex"><Bell className="size-[18px] text-[#777381]" /></Button>
          <div className="mx-1 hidden h-6 w-px bg-[#e9e7ef] sm:block" /><ClinicSwitcher compact />
        </div>
      </header>
      <main className="mx-auto max-w-[1510px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">{children}</main>
    </div>
  </div>;
}
