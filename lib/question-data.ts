import { getDatabaseBinding } from '@/db';
import type { ClinicId } from '@/lib/clinics';
import type { SearchImport } from '@/lib/search-console';
import { buildQuestionSet } from '@/lib/question-opportunities';

export async function readQuestionSet(clinicId: ClinicId) {
  // Uploading an older report or a Pages CSV must not replace the newest Queries data.
  const row = await getDatabaseBinding().prepare(`SELECT id, clinic_id AS clinicId, property_url AS propertyUrl, start_date AS startDate, end_date AS endDate, dimension, filename, rows_json AS rowsJson, created_at AS createdAt FROM search_console_imports WHERE clinic_id = ? AND dimension = 'query' ORDER BY end_date DESC, start_date DESC, created_at DESC, rowid DESC LIMIT 1`).bind(clinicId).first<Omit<SearchImport, 'rows'> & { rowsJson: string }>();
  if (!row) return buildQuestionSet(clinicId, null);
  const { rowsJson, ...metadata } = row;
  return buildQuestionSet(clinicId, { ...metadata, rows: JSON.parse(rowsJson) });
}
