import { fetchGa4Report, ga4Error, privateJson, requireGa4User } from '@/lib/ga4-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { return privateJson({ report: await fetchGa4Report(requireGa4User(request), new URL(request.url).searchParams) }); } catch (error) { return ga4Error(error); } }
