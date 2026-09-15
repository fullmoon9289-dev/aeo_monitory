import { disconnectGa4, ga4Error, requireGa4User } from '@/lib/ga4-server';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) { try { return await disconnectGa4(requireGa4User(request, true)); } catch (error) { return ga4Error(error); } }
