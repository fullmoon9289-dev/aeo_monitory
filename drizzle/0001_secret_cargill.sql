CREATE TABLE `search_console_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`property_url` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`dimension` text NOT NULL,
	`filename` text NOT NULL,
	`row_count` integer NOT NULL,
	`rows_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_search_imports_clinic_created` ON `search_console_imports` (`clinic_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `publishing_schedules` ADD `clinic_id` text DEFAULT 'withyou-clinic' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_publishing_schedules_clinic_created` ON `publishing_schedules` (`clinic_id`,`created_at`);