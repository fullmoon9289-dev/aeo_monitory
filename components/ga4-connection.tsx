'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Ga4Data } from '@/hooks/use-ga4';
import { GA4_PROPERTY_ID } from '@/lib/ga4';

export function Ga4Connection({ data }: { data: Ga4Data }) {
  const [message, setMessage] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href), result = url.searchParams.get('ga4');
    if (!result) return;
    setMessage(result === 'connected' ? 'Google 읽기 권한이 연결됐습니다. 실제 데이터를 조회할 수 있습니다.' : result === 'cancelled' ? 'Google 권한 승인을 취소했습니다. 다시 연결할 수 있습니다.' : '연결을 완료하지 못했습니다. 서버 설정·GA4 읽기 권한·테스트 사용자 등록 여부를 확인한 뒤 다시 시작해 주세요.');
    url.searchParams.delete('ga4'); window.history.replaceState(null, '', url);
  }, []);
  async function disconnect() {
    setDisconnecting(true); setMessage('');
    try { const response = await fetch('/api/ga4/disconnect', { method: 'POST' }); const body = await response.json() as { error?: string }; if (!response.ok) throw new Error(body.error); setConfirmDisconnect(false); data.reload(); setMessage('메디앤서에 저장된 골드만 연결을 해제했습니다. Google 계정의 앱 권한은 별도로 남아 있습니다.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '연결 해제에 실패했습니다.'); }
    finally { setDisconnecting(false); }
  }
  const status = data.status;
  return <>
    <p className="mt-3 text-sm font-semibold text-[#6957e8]">{data.loading && !status ? '연결 상태 확인 중' : !status ? '연결 상태 확인 필요' : !status.configured ? 'Google 서버 설정 대기' : status.needsReconnect ? '읽기 권한 재연결 필요' : status.connected ? 'GA4 읽기 권한 연결됨' : 'Google 읽기 권한 승인 대기'}</p>
    <p className="mt-2 text-sm leading-7 text-[#777381]">골드만 웹 · 속성 {GA4_PROPERTY_ID}<br />전체 방문, 유입 출처, 이벤트와 확인 가능한 AI 추천 방문을 조회합니다. AI 답변 언급률·인용률은 별도 측정이 필요합니다.</p>
    {(message || data.error) && <p role="status" className="mt-3 text-xs leading-6 text-[#a56225]">{message || data.error}</p>}
    {status?.configured && <form method="post" action="/api/ga4/connect" target="_top" className="mt-5"><Button type="submit" variant="outline">{status.connected ? 'Google 읽기 권한 다시 연결' : 'Google 계정으로 GA4 연결'}</Button></form>}
    <details className="mt-4 text-xs leading-6 text-[#777381]" open={status ? !status.configured : false}><summary className="cursor-pointer font-semibold text-[#6957e8]">Google 연결 준비 안내</summary><ol className="mt-2 list-decimal space-y-2 pl-5">
      <li>Google Cloud에서 프로젝트를 선택하고 <a className="underline" href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" rel="noreferrer">Google Analytics Data API</a>를 사용 설정합니다.</li>
      <li>Google Auth Platform에서 동의 화면을 설정하고, 테스트 단계라면 골드만 GA4에 접근할 Google 계정을 테스트 사용자로 추가합니다.</li>
      <li>OAuth 클라이언트를 ‘웹 애플리케이션’으로 생성하고 아래 리디렉션 URI를 그대로 등록합니다.<code className="mt-1 block break-all rounded bg-[#f7f5ff] p-2">https://mediaanswer-aeo.fullmoon9289.chatgpt.site/api/ga4/callback</code></li>
      <li>서비스 운영자가 Client ID·Client Secret과 토큰 암호화 키를 서버의 비밀 설정에 등록해야 합니다. 비밀값을 채팅이나 GitHub에 올리지 마세요.</li>
      <li>설정 적용 후 위 연결 버튼으로 골드만 속성의 읽기 권한을 승인합니다. 해당 Google 계정은 GA4 속성에서 최소 ‘뷰어’ 권한이 필요합니다.</li>
    </ol><p className="mt-3">테스트 상태에서는 읽기 권한이 7일 후 만료될 수 있습니다. 실제 고객 서비스 전에는 Google 앱 심사·공개 상태와 개인정보 처리방침을 준비해야 합니다.</p><p className="mt-2">이 연결은 Google 설정을 수정하거나 환자 정보를 가져오지 않습니다. 집계 지표만 조회하며, 환자 이름·연락처·상담 내용은 GA4로 보내면 안 됩니다.</p></details>
    <p className="mt-4 text-[10px] leading-5 text-[#8f8b98]">화면 진입·기간 변경·새로고침 시 조회합니다. 백그라운드 정기 수집이나 과거 보고서 자동 보관 기능은 아닙니다.</p>
    {status?.connectedAt && <div className="mt-3">{confirmDisconnect ? <div className="text-xs leading-6"><p>메디앤서에 저장된 골드만 인증 토큰만 삭제합니다. 다른 병원 자료와 CSV는 유지됩니다. 해제할까요?</p><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" disabled={disconnecting} onClick={disconnect}>연결 해제 확인</Button><Button size="sm" variant="ghost" disabled={disconnecting} onClick={() => setConfirmDisconnect(false)}>취소</Button></div></div> : <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(true)}>메디앤서 연결 해제</Button>}</div>}
  </>;
}
