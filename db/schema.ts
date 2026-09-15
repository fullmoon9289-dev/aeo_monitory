import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Site-private pilot: each connection belongs to the dispatcher-authenticated user.
export const ga4Connections = sqliteTable('ga4_connections', {
  userId: text('user_id').primaryKey(),
  id: text('id').notNull(),
  clinicId: text('clinic_id').notNull(),
  propertyId: text('property_id').notNull(),
  encryptedToken: text('encrypted_token').notNull(),
  timezone: text('timezone').notNull(),
  connectedAt: text('connected_at').notNull(),
  lastFetchedAt: text('last_fetched_at'),
  needsReconnect: integer('needs_reconnect').notNull().default(0),
});
export const ga4OauthStates = sqliteTable('ga4_oauth_states', {
  stateHash: text('state_hash').primaryKey(),
  userId: text('user_id').notNull(),
  bindingHash: text('binding_hash').notNull(),
  encryptedVerifier: text('encrypted_verifier').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('idx_ga4_states_user').on(table.userId), index('idx_ga4_states_expiry').on(table.expiresAt)]);

export const publishingSchedules = sqliteTable(
  'publishing_schedules',
  {
    id: text('id').primaryKey(),
    clinicId: text('clinic_id').notNull().default('withyou-clinic'),
    intervalDays: integer('interval_days').notNull(),
    totalCount: integer('total_count').notNull(),
    startDate: text('start_date').notNull(),
    publishTime: text('publish_time').notNull(),
    timezone: text('timezone').notNull().default('Asia/Seoul'),
    status: text('status').notNull().default('waiting_cms'),
    approvedOnly: integer('approved_only', { mode: 'boolean' })
      .notNull()
      .default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_publishing_schedules_created_at').on(table.createdAt), index('idx_publishing_schedules_clinic_created').on(table.clinicId, table.createdAt)],
);

export const publishingQueueItems = sqliteTable(
  'publishing_queue_items',
  {
    id: text('id').primaryKey(),
    scheduleId: text('schedule_id')
      .notNull()
      .references(() => publishingSchedules.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    question: text('question').notNull(),
    title: text('title').notNull(),
    scheduledFor: text('scheduled_for').notNull(),
    status: text('status').notNull().default('draft_required'),
    cmsPostId: text('cms_post_id'),
    canonicalUrl: text('canonical_url'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_queue_items_schedule_sequence').on(
      table.scheduleId,
      table.sequence,
    ),
    index('idx_queue_items_status_scheduled').on(
      table.status,
      table.scheduledFor,
    ),
  ],
);

export const searchConsoleImports = sqliteTable(
  'search_console_imports',
  {
    id: text('id').primaryKey(),
    clinicId: text('clinic_id').notNull(),
    propertyUrl: text('property_url').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    dimension: text('dimension').notNull(),
    filename: text('filename').notNull(),
    rowCount: integer('row_count').notNull(),
    rowsJson: text('rows_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_search_imports_clinic_created').on(table.clinicId, table.createdAt)],
);
