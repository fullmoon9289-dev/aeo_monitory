import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDatabaseBinding() {
  if (!env.DB) {
    throw new Error('콘텐츠 발행 계획 저장소가 아직 연결되지 않았습니다.');
  }

  return env.DB;
}

export function getDb() {
  return drizzle(getDatabaseBinding(), { schema });
}
