CREATE TABLE `publishing_queue_items` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`question` text NOT NULL,
	`title` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`status` text DEFAULT 'draft_required' NOT NULL,
	`cms_post_id` text,
	`canonical_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`schedule_id`) REFERENCES `publishing_schedules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_queue_items_schedule_sequence` ON `publishing_queue_items` (`schedule_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_queue_items_status_scheduled` ON `publishing_queue_items` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE TABLE `publishing_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`interval_days` integer NOT NULL,
	`total_count` integer NOT NULL,
	`start_date` text NOT NULL,
	`publish_time` text NOT NULL,
	`timezone` text DEFAULT 'Asia/Seoul' NOT NULL,
	`status` text DEFAULT 'waiting_cms' NOT NULL,
	`approved_only` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_publishing_schedules_created_at` ON `publishing_schedules` (`created_at`);--> statement-breakpoint
PRAGMA optimize;
