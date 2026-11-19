CREATE TABLE `dataset_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`kind` text NOT NULL,
	`refresh_id` integer,
	`provenance` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`lane_id` text NOT NULL,
	`po_value` real NOT NULL,
	`window_days` integer NOT NULL,
	`assumptions` text NOT NULL,
	`result` text NOT NULL,
	`dataset_version_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`dataset_version_id`) REFERENCES `dataset_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `decisions_owner_idx` ON `decisions` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `disruptions` (
	`id` text PRIMARY KEY NOT NULL,
	`corridor` text NOT NULL,
	`status` text NOT NULL,
	`effective_date` text,
	`headline` text NOT NULL,
	`status_note` text NOT NULL,
	`fact_ids` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `facts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`quote` text NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kv` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lanes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`origin` text NOT NULL,
	`dest` text NOT NULL,
	`disruption_id` text NOT NULL,
	`status` text NOT NULL,
	`primary_delay_days` integer NOT NULL,
	`primary_delay_basis` text NOT NULL,
	`primary_delay_fact_id` text,
	`routes` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`disruption_id`) REFERENCES `disruptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `owner_assumptions` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`assumptions` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_idx` ON `rate_events` (`owner_id`,`kind`,`at`);--> statement-breakpoint
CREATE TABLE `refreshes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`started_at` text NOT NULL,
	`ok` integer NOT NULL,
	`failures` text NOT NULL,
	`provenance` text NOT NULL,
	`dataset_version_id` integer
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`publisher` text NOT NULL,
	`url` text NOT NULL,
	`api_title` text,
	`verify` integer NOT NULL,
	`note` text
);
