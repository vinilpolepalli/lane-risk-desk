import { json } from '@/lib/http';
import { loadDataset } from '@/lib/repo';
export const dynamic = 'force-dynamic';
export async function GET() { return json(await loadDataset()); }
