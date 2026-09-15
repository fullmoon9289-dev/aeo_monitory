import { isClinicId } from '@/lib/clinics';
import { readQuestionSet } from '@/lib/question-data';

export async function GET(request: Request) {
  const clinicId = new URL(request.url).searchParams.get('clinicId');
  if (!isClinicId(clinicId)) return Response.json({ error: '병원을 선택해 주세요.' }, { status: 400 });
  try {
    return Response.json({ questionSet: await readQuestionSet(clinicId) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Question data unavailable', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: '검색 자료 저장소를 확인하지 못했습니다. 잠시 후 다시 열어 주세요.' }, { status: 503 });
  }
}
