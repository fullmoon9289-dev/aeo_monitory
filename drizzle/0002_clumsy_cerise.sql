CREATE TABLE `ga4_connections` (
	`user_id` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`property_id` text NOT NULL,
	`encrypted_token` text NOT NULL,
	`timezone` text NOT NULL,
	`connected_at` text NOT NULL,
	`last_fetched_at` text,
	`needs_reconnect` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ga4_oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`binding_hash` text NOT NULL,
	`encrypted_verifier` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ga4_states_user` ON `ga4_oauth_states` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ga4_states_expiry` ON `ga4_oauth_states` (`expires_at`);