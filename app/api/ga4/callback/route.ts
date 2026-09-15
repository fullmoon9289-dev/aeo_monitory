import { callbackRedirect, completeOAuth, requireGa4User } from '@/lib/ga4-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { return await completeOAuth(request, requireGa4User(request)); } catch { return callbackRedirect('failed'); } }
