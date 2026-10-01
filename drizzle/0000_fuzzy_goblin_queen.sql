CREATE TABLE `board_status` (
	`id` text PRIMARY KEY NOT NULL,
	`error_code` text NOT NULL,
	`attempted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily` (
	`id` text PRIMARY KEY NOT NULL,
	`signal_id` text NOT NULL,
	`record_date` text NOT NULL,
	`reading` text NOT NULL,
	`raw` text NOT NULL
);
