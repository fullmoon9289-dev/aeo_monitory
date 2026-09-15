import { connectionStatus, ga4Error, privateJson, requireGa4User } from '@/lib/ga4-server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { return privateJson(await connectionStatus(requireGa4User(request))); } catch (error) { return ga4Error(error); } }
