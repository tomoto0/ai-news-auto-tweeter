CREATE TABLE `account_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`frequency` enum('hourly','every_3_hours','every_6_hours','daily') NOT NULL DEFAULT 'daily',
	`preferredHour` int DEFAULT 9,
	`timezone` varchar(64) DEFAULT 'Asia/Tokyo',
	`maxTweetsPerDay` int DEFAULT 5,
	`cronExpression` varchar(255) DEFAULT '0 0 * * *',
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twitter_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountHandle` varchar(255),
	`apiKey` text NOT NULL,
	`apiSecret` text NOT NULL,
	`accessToken` text NOT NULL,
	`accessTokenSecret` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isValid` boolean NOT NULL DEFAULT true,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twitter_accounts_id` PRIMARY KEY(`id`)
);
