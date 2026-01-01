CREATE TABLE `schedule_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`frequency` enum('hourly','every_3_hours','every_6_hours','daily') NOT NULL DEFAULT 'daily',
	`preferredHour` int DEFAULT 9,
	`timezone` varchar(64) DEFAULT 'Asia/Tokyo',
	`maxTweetsPerDay` int DEFAULT 5,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tweet_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`originalNewsTitle` text,
	`originalNewsUrl` text,
	`tweetId` varchar(64),
	`status` enum('pending','posted','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`postedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tweet_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `x_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` text NOT NULL,
	`apiSecret` text NOT NULL,
	`accessToken` text NOT NULL,
	`accessTokenSecret` text NOT NULL,
	`isValid` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `x_credentials_id` PRIMARY KEY(`id`)
);
