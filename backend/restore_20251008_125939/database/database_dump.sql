BEGIN TRANSACTION;
CREATE TABLE admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );
INSERT INTO "admin_users" VALUES(1,'admin','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',1,'2025-08-28 01:14:18',NULL);
CREATE TABLE "bell_events" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_day_id INTEGER NOT NULL,
                time TIME NOT NULL,
                sound_id INTEGER,
                tts_text TEXT,
                repeat_tag TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, description TEXT,
                FOREIGN KEY (schedule_day_id) REFERENCES schedule_days (id) ON DELETE CASCADE,
                FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE SET NULL
            );
INSERT INTO "bell_events" VALUES(35,1,'07:45:00.000000',13,NULL,'',1,'2025-09-02 00:39:09','1st Period (M-F)');
INSERT INTO "bell_events" VALUES(36,2,'07:45:00.000000',13,NULL,'',1,'2025-09-02 00:39:09','1st Period (M-F)');
INSERT INTO "bell_events" VALUES(37,3,'07:45:00.000000',13,NULL,'',1,'2025-09-02 00:39:09','1st Period (M-F)');
INSERT INTO "bell_events" VALUES(38,4,'07:45:00.000000',13,NULL,'',1,'2025-09-02 00:39:09','1st Period (M-F)');
INSERT INTO "bell_events" VALUES(39,5,'07:45:00.000000',13,NULL,'',1,'2025-09-02 00:39:09','1st Period (M-F)');
INSERT INTO "bell_events" VALUES(40,1,'07:39:00.000000',13,NULL,'',1,'2025-09-02 00:40:35','Morning Bell');
INSERT INTO "bell_events" VALUES(41,2,'07:39:00.000000',13,NULL,'',1,'2025-09-02 00:40:35','Morning Bell');
INSERT INTO "bell_events" VALUES(42,3,'07:39:00.000000',13,NULL,'',1,'2025-09-02 00:40:35','Morning Bell');
INSERT INTO "bell_events" VALUES(43,4,'07:39:00.000000',13,NULL,'',1,'2025-09-02 00:40:35','Morning Bell');
INSERT INTO "bell_events" VALUES(44,5,'07:39:00.000000',13,NULL,'',1,'2025-09-02 00:40:35','Morning Bell');
INSERT INTO "bell_events" VALUES(45,1,'08:35:00.000000',13,NULL,'',1,'2025-09-02 00:41:26','End of 1st Period (M-R)');
INSERT INTO "bell_events" VALUES(46,2,'08:35:00.000000',13,NULL,'',1,'2025-09-02 00:41:26','End of 1st Period (M-R)');
INSERT INTO "bell_events" VALUES(47,3,'08:35:00.000000',13,NULL,'',1,'2025-09-02 00:41:26','End of 1st Period (M-R)');
INSERT INTO "bell_events" VALUES(48,4,'08:35:00.000000',13,NULL,'',1,'2025-09-02 00:41:26','End of 1st Period (M-R)');
INSERT INTO "bell_events" VALUES(49,1,'08:39:00.000000',13,NULL,'',1,'2025-09-02 00:42:03','2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(50,2,'08:39:00.000000',13,NULL,'',1,'2025-09-02 00:42:03','2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(51,3,'08:39:00.000000',13,NULL,'',1,'2025-09-02 00:42:03','2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(52,4,'08:39:00.000000',13,NULL,'',1,'2025-09-02 00:42:03','2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(57,1,'09:29:00.000000',13,NULL,'',1,'2025-09-02 00:44:24','End of 2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(58,2,'09:29:00.000000',13,NULL,'',1,'2025-09-02 00:44:25','End of 2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(59,3,'09:29:00.000000',13,NULL,'',1,'2025-09-02 00:44:25','End of 2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(60,4,'09:29:00.000000',13,NULL,'',1,'2025-09-02 00:44:25','End of 2nd Period (M-R)');
INSERT INTO "bell_events" VALUES(68,1,'09:33:00.000000',13,NULL,'',1,'2025-09-03 01:34:03','3rd period (M-R)');
INSERT INTO "bell_events" VALUES(69,2,'09:33:00.000000',13,NULL,'',1,'2025-09-03 01:34:03','3rd period (M-R)');
INSERT INTO "bell_events" VALUES(70,3,'09:33:00.000000',13,NULL,'',1,'2025-09-03 01:34:03','3rd period (M-R)');
INSERT INTO "bell_events" VALUES(71,4,'09:33:00.000000',13,NULL,'',1,'2025-09-03 01:34:03','3rd period (M-R)');
INSERT INTO "bell_events" VALUES(72,1,'10:28:00.000000',13,NULL,'',1,'2025-09-03 01:34:34','End of 3rd Period (M-R)');
INSERT INTO "bell_events" VALUES(73,2,'10:28:00.000000',13,NULL,'',1,'2025-09-03 01:34:34','End of 3rd Period (M-R)');
INSERT INTO "bell_events" VALUES(74,3,'10:28:00.000000',13,NULL,'',1,'2025-09-03 01:34:34','End of 3rd Period (M-R)');
INSERT INTO "bell_events" VALUES(75,4,'10:28:00.000000',13,NULL,'',1,'2025-09-03 01:34:34','End of 3rd Period (M-R)');
INSERT INTO "bell_events" VALUES(76,1,'10:32:00.000000',13,NULL,'',1,'2025-09-03 01:35:24','4th period (M-R)');
INSERT INTO "bell_events" VALUES(77,2,'10:32:00.000000',13,NULL,'',1,'2025-09-03 01:35:24','4th period (M-R)');
INSERT INTO "bell_events" VALUES(78,3,'10:32:00.000000',13,NULL,'',1,'2025-09-03 01:35:24','4th period (M-R)');
INSERT INTO "bell_events" VALUES(79,4,'10:32:00.000000',13,NULL,'',1,'2025-09-03 01:35:24','4th period (M-R)');
INSERT INTO "bell_events" VALUES(80,1,'11:22:00.000000',13,NULL,'',1,'2025-09-03 01:36:13','End of 4th Period (M-R)');
INSERT INTO "bell_events" VALUES(81,2,'11:22:00.000000',13,NULL,'',1,'2025-09-03 01:36:13','End of 4th Period (M-R)');
INSERT INTO "bell_events" VALUES(82,3,'11:22:00.000000',13,NULL,'',1,'2025-09-03 01:36:13','End of 4th Period (M-R)');
INSERT INTO "bell_events" VALUES(83,4,'11:22:00.000000',13,NULL,'',1,'2025-09-03 01:36:13','End of 4th Period (M-R)');
INSERT INTO "bell_events" VALUES(84,1,'11:26:00.000000',13,NULL,'',1,'2025-09-03 01:40:44','5th Period (M-R)');
INSERT INTO "bell_events" VALUES(85,2,'11:26:00.000000',13,NULL,'',1,'2025-09-03 01:40:44','5th Period (M-R)');
INSERT INTO "bell_events" VALUES(86,3,'11:26:00.000000',13,NULL,'',1,'2025-09-03 01:40:44','5th Period (M-R)');
INSERT INTO "bell_events" VALUES(87,4,'11:26:00.000000',13,NULL,'',1,'2025-09-03 01:40:44','5th Period (M-R)');
INSERT INTO "bell_events" VALUES(88,1,'12:16:00.000000',13,NULL,'',1,'2025-09-03 01:41:26','End of 5th Period');
INSERT INTO "bell_events" VALUES(89,2,'12:16:00.000000',13,NULL,'',1,'2025-09-03 01:41:26','End of 5th Period');
INSERT INTO "bell_events" VALUES(90,3,'12:16:00.000000',13,NULL,'',1,'2025-09-03 01:41:26','End of 5th Period');
INSERT INTO "bell_events" VALUES(91,4,'12:16:00.000000',13,NULL,'',1,'2025-09-03 01:41:26','End of 5th Period');
INSERT INTO "bell_events" VALUES(92,1,'12:20:00.000000',13,NULL,'',1,'2025-09-03 01:42:29','6th Period (M-R)');
INSERT INTO "bell_events" VALUES(93,2,'12:20:00.000000',13,NULL,'',1,'2025-09-03 01:42:29','6th Period (M-R)');
INSERT INTO "bell_events" VALUES(94,3,'12:20:00.000000',13,NULL,'',1,'2025-09-03 01:42:29','6th Period (M-R)');
INSERT INTO "bell_events" VALUES(95,4,'12:20:00.000000',13,NULL,'',1,'2025-09-03 01:42:29','6th Period (M-R)');
INSERT INTO "bell_events" VALUES(96,1,'13:10:00.000000',13,NULL,'',1,'2025-09-03 01:50:15','End of 6th Period (M-R)');
INSERT INTO "bell_events" VALUES(97,2,'13:10:00.000000',13,NULL,'',1,'2025-09-03 01:50:15','End of 6th Period (M-R)');
INSERT INTO "bell_events" VALUES(98,4,'13:10:00.000000',13,NULL,'',1,'2025-09-03 01:50:15','End of 6th Period (M-R)');
INSERT INTO "bell_events" VALUES(99,3,'13:10:00.000000',13,NULL,'',1,'2025-09-03 01:50:15','End of 6th Period (M-R)');
INSERT INTO "bell_events" VALUES(100,1,'13:14:00.000000',13,NULL,'',1,'2025-09-03 01:51:55','7th Period (M-R)');
INSERT INTO "bell_events" VALUES(101,2,'13:14:00.000000',13,NULL,'',1,'2025-09-03 01:51:55','7th Period (M-R)');
INSERT INTO "bell_events" VALUES(102,3,'13:14:00.000000',13,NULL,'',1,'2025-09-03 01:51:56','7th Period (M-R)');
INSERT INTO "bell_events" VALUES(103,4,'13:14:00.000000',13,NULL,'',1,'2025-09-03 01:51:56','7th Period (M-R)');
INSERT INTO "bell_events" VALUES(108,1,'14:04:00.000000',13,NULL,'',1,'2025-09-03 01:53:32','End of 7th Period');
INSERT INTO "bell_events" VALUES(109,2,'14:04:00.000000',13,NULL,'',1,'2025-09-03 01:53:32','End of 7th Period');
INSERT INTO "bell_events" VALUES(110,3,'14:04:00.000000',13,NULL,'',1,'2025-09-03 01:53:32','End of 7th Period');
INSERT INTO "bell_events" VALUES(111,4,'14:04:00.000000',13,NULL,'',1,'2025-09-03 01:53:32','End of 7th Period');
INSERT INTO "bell_events" VALUES(112,1,'14:08:00.000000',13,NULL,'',1,'2025-09-03 01:57:37','8th Period (M-R)');
INSERT INTO "bell_events" VALUES(113,2,'14:08:00.000000',13,NULL,'',1,'2025-09-03 01:57:37','8th Period (M-R)');
INSERT INTO "bell_events" VALUES(114,3,'14:08:00.000000',13,NULL,'',1,'2025-09-03 01:57:37','8th Period (M-R)');
INSERT INTO "bell_events" VALUES(115,4,'14:08:00.000000',13,NULL,'',1,'2025-09-03 01:57:37','8th Period (M-R)');
INSERT INTO "bell_events" VALUES(120,1,'14:58:00.000000',13,NULL,'',1,'2025-09-03 01:59:09','End of 8th Period (M-R)');
INSERT INTO "bell_events" VALUES(121,2,'14:58:00.000000',13,NULL,'',1,'2025-09-03 01:59:10','End of 8th Period (M-R)');
INSERT INTO "bell_events" VALUES(122,3,'14:58:00.000000',13,NULL,'',1,'2025-09-03 01:59:10','End of 8th Period (M-R)');
INSERT INTO "bell_events" VALUES(123,4,'14:58:00.000000',13,NULL,'',1,'2025-09-03 01:59:10','End of 8th Period (M-R)');
INSERT INTO "bell_events" VALUES(127,1,'07:43:20.000000',14,NULL,'',1,'2025-09-05 00:13:29','Morning Music');
INSERT INTO "bell_events" VALUES(128,2,'07:43:20.000000',14,NULL,'',1,'2025-09-05 00:13:29','Morning Music');
INSERT INTO "bell_events" VALUES(129,3,'07:43:20.000000',14,NULL,'',1,'2025-09-05 00:13:29','Morning Music');
INSERT INTO "bell_events" VALUES(130,4,'07:43:20.000000',14,NULL,'',1,'2025-09-05 00:13:29','Morning Music');
INSERT INTO "bell_events" VALUES(131,5,'07:43:20.000000',14,NULL,'',1,'2025-09-05 00:13:29','Morning Music');
INSERT INTO "bell_events" VALUES(132,1,'08:38:00.000000',17,NULL,'',1,'2025-09-05 00:19:09','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(133,2,'08:38:00.000000',17,NULL,'',1,'2025-09-05 00:19:09','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(134,3,'08:38:00.000000',17,NULL,'',1,'2025-09-05 00:19:09','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(135,4,'08:38:00.000000',17,NULL,'',1,'2025-09-05 00:19:09','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(136,1,'09:32:00.000000',17,NULL,'',1,'2025-09-05 00:19:56','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(137,2,'09:32:00.000000',17,NULL,'',1,'2025-09-05 00:19:56','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(138,3,'09:32:00.000000',17,NULL,'',1,'2025-09-05 00:19:56','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(139,4,'09:32:00.000000',17,NULL,'',1,'2025-09-05 00:19:56','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(140,1,'10:31:00.000000',17,NULL,'',1,'2025-09-05 00:20:49','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(141,2,'10:31:00.000000',17,NULL,'',1,'2025-09-05 00:20:49','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(142,3,'10:31:00.000000',17,NULL,'',1,'2025-09-05 00:20:49','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(143,4,'10:31:00.000000',17,NULL,'',1,'2025-09-05 00:20:49','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(144,1,'11:25:00.000000',17,NULL,'',1,'2025-09-05 00:21:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(145,2,'11:25:00.000000',17,NULL,'',1,'2025-09-05 00:21:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(146,3,'11:25:00.000000',17,NULL,'',1,'2025-09-05 00:21:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(147,4,'11:25:00.000000',17,NULL,'',1,'2025-09-05 00:21:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(148,1,'12:19:00.000000',17,NULL,'',1,'2025-09-05 00:22:22','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(149,2,'12:19:00.000000',17,NULL,'',1,'2025-09-05 00:22:22','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(150,3,'12:19:00.000000',17,NULL,'',1,'2025-09-05 00:22:22','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(151,4,'12:19:00.000000',17,NULL,'',1,'2025-09-05 00:22:23','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(152,1,'13:13:00.000000',17,NULL,'',1,'2025-09-05 00:23:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(153,2,'13:13:00.000000',17,NULL,'',1,'2025-09-05 00:23:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(154,3,'13:13:00.000000',17,NULL,'',1,'2025-09-05 00:23:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(155,4,'13:13:00.000000',17,NULL,'',1,'2025-09-05 00:23:25','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(156,1,'14:07:00.000000',17,NULL,'',1,'2025-09-05 00:24:07','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(157,2,'14:07:00.000000',17,NULL,'',1,'2025-09-05 00:24:07','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(158,3,'14:07:00.000000',17,NULL,'',1,'2025-09-05 00:24:07','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(159,4,'14:07:00.000000',17,NULL,'',1,'2025-09-05 00:24:07','Passing End (M-R)');
INSERT INTO "bell_events" VALUES(160,5,'08:30:00.000000',13,NULL,'',1,'2025-09-05 01:48:11','End of 1st Period (F)');
INSERT INTO "bell_events" VALUES(161,5,'08:34:00.000000',13,NULL,'',1,'2025-09-05 01:52:09','2nd Period (F)');
INSERT INTO "bell_events" VALUES(162,5,'09:19:00.000000',13,NULL,'',1,'2025-09-05 01:52:47','End of 2nd Period (F)');
INSERT INTO "bell_events" VALUES(163,5,'09:23:00.000000',13,NULL,'',1,'2025-09-05 01:53:46','3rd Period (F)');
INSERT INTO "bell_events" VALUES(164,5,'10:13:00.000000',13,NULL,'',1,'2025-09-05 01:56:35','End of 3rd Period (F)');
INSERT INTO "bell_events" VALUES(165,5,'10:17:00.000000',13,NULL,'',1,'2025-09-05 01:57:06','4th Period (F)');
INSERT INTO "bell_events" VALUES(166,5,'11:02:00.000000',13,NULL,'',1,'2025-09-05 01:57:43','End of 4th (Period)');
INSERT INTO "bell_events" VALUES(167,5,'11:06:00.000000',13,NULL,'',1,'2025-09-05 01:59:26','5th Period (F)');
INSERT INTO "bell_events" VALUES(168,5,'11:51:00.000000',13,NULL,'',1,'2025-09-05 02:00:04','End of 5th Period (F)');
INSERT INTO "bell_events" VALUES(169,5,'11:55:00.000000',13,NULL,'',1,'2025-09-05 02:00:48','6th Period (F)');
INSERT INTO "bell_events" VALUES(170,5,'12:40:00.000000',13,NULL,'',1,'2025-09-05 02:01:19','End of 6th Period (F)');
INSERT INTO "bell_events" VALUES(171,5,'12:44:00.000000',13,NULL,'',1,'2025-09-05 02:02:00','7th Period (F)');
INSERT INTO "bell_events" VALUES(172,5,'13:29:00.000000',13,NULL,'',1,'2025-09-05 02:02:42','End of 7th Period (F)');
INSERT INTO "bell_events" VALUES(173,5,'13:33:00.000000',13,NULL,'',1,'2025-09-05 02:03:46','8th Period (F)');
INSERT INTO "bell_events" VALUES(174,5,'14:18:00.000000',13,NULL,'',1,'2025-09-05 02:04:50','End of 8th Period (F)');
INSERT INTO "bell_events" VALUES(175,5,'08:33:00.000000',17,NULL,'',1,'2025-09-05 02:07:31','Passing End (F)');
INSERT INTO "bell_events" VALUES(176,5,'09:22:00.000000',17,NULL,'',1,'2025-09-05 02:07:49','Passing End (F)');
INSERT INTO "bell_events" VALUES(177,5,'10:16:00.000000',17,NULL,'',1,'2025-09-05 02:08:06','Passing End (F)');
INSERT INTO "bell_events" VALUES(178,5,'11:05:00.000000',17,NULL,'',1,'2025-09-05 02:12:03','Passing End (F)');
INSERT INTO "bell_events" VALUES(179,5,'11:54:00.000000',17,NULL,'',1,'2025-09-05 02:12:27','Passing End (F)');
INSERT INTO "bell_events" VALUES(180,5,'12:43:00.000000',17,NULL,'',1,'2025-09-05 02:12:47','Passing End (F)');
INSERT INTO "bell_events" VALUES(181,5,'13:32:00.000000',17,NULL,'',1,'2025-09-05 02:13:17','Passing End (F)');
CREATE TABLE schedule_days (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_id INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
            );
INSERT INTO "schedule_days" VALUES(1,3,0,1);
INSERT INTO "schedule_days" VALUES(2,3,1,1);
INSERT INTO "schedule_days" VALUES(3,3,2,1);
INSERT INTO "schedule_days" VALUES(4,3,3,1);
INSERT INTO "schedule_days" VALUES(5,3,4,1);
CREATE TABLE schedules (
	id INTEGER NOT NULL, 
	name VARCHAR, 
	is_default BOOLEAN, 
	days JSON, 
	is_muted BOOLEAN, description TEXT, is_active INTEGER DEFAULT 1, created_at TEXT, updated_at TEXT, 
	PRIMARY KEY (id)
);
INSERT INTO "schedules" VALUES(1,'Regular',0,'{}',0,NULL,1,NULL,'2025-10-03 12:13:09');
INSERT INTO "schedules" VALUES(2,'Regular',0,'{}',0,NULL,1,NULL,'2025-10-03 12:13:09');
INSERT INTO "schedules" VALUES(3,'Regular Bells',1,NULL,0,'Regular bell schedule (Monday-Friday)',1,'2025-08-27 21:22:11.785925','2025-10-03 12:13:09');
CREATE TABLE sounds (
	id INTEGER NOT NULL, 
	name VARCHAR, 
	file_path VARCHAR, 
	description VARCHAR, 
	tags VARCHAR, 
	type VARCHAR, duration INTEGER, created_at TEXT, updated_at TEXT, 
	PRIMARY KEY (id)
);
INSERT INTO "sounds" VALUES(5,'Dukane Bell 1','static/sounds/7fe97b1e_Dukane_Bell_1.wav','Default Bell','bell','bell',2,NULL,'2025-09-04 23:59:37');
INSERT INTO "sounds" VALUES(6,'Dukane Bell 2','static/sounds/4c0cb72d_Dukane_Bell_2.wav','','bell','bell',2,NULL,'2025-09-04 23:59:49');
INSERT INTO "sounds" VALUES(7,'Dukane Bell 3','static/sounds/17bc1837_Dukane_Bell_3.wav','','bell','bell',5,NULL,'2025-09-04 23:59:57');
INSERT INTO "sounds" VALUES(8,'Dukane Bell 4','static/sounds/6ee36a47_Dukane_Bell_4.wav','','bell','bell',10,NULL,'2025-09-05 00:00:08');
INSERT INTO "sounds" VALUES(9,'Jazz Lounge','static/sounds/43c24928_Jazz_Lounge.mp3','Jazz Lounge Music','','music',87,NULL,'2025-08-29 01:57:15');
INSERT INTO "sounds" VALUES(13,'Standard Bell','static/sounds/77e01829_Standard_Bell.mp3','Regular Bell','','bell',2,NULL,'2025-09-05 00:12:39');
INSERT INTO "sounds" VALUES(14,'Notre Dame Victory March','static/sounds/91c0fb3a_Notre_Dame_Victory_March.mp3','Morning Song','','music',95,NULL,NULL);
INSERT INTO "sounds" VALUES(15,'Golden_1min','static/sounds/6894669a_Golden_1min.mp3','Passing Period','','music',56,NULL,NULL);
INSERT INTO "sounds" VALUES(16,'La_Gozadera_1min','static/sounds/63f0ff01_La_Gozadera_1min.mp3','Passing Period','spanish','music',59,NULL,NULL);
INSERT INTO "sounds" VALUES(17,'La_Gozadera_AMP_1min','static/sounds/e08c946f_La_Gozadera_AMP_1min.mp3','Passing Period','hispanic heritage','music',59,NULL,NULL);
INSERT INTO "sounds" VALUES(18,'Cheer_Foreman_High','static/sounds/52d6cb38_Cheer_Foreman_High.mp3','Morning Song','foreman song','music',99,NULL,NULL);
INSERT INTO "sounds" VALUES(19,'Mi_Gente_1min','static/sounds/61436166_Mi_Gente_1min.mp3','Passing Music','spanish heritage','music',59,NULL,NULL);
CREATE TABLE special_bell_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    special_schedule_day_id INTEGER NOT NULL,
                    time TIME NOT NULL,
                    description TEXT NOT NULL,
                    sound_id INTEGER,
                    tts_text TEXT,
                    repeat_tag TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (special_schedule_day_id) REFERENCES special_schedule_days (id) ON DELETE CASCADE,
                    FOREIGN KEY (sound_id) REFERENCES sounds (id) ON DELETE SET NULL
                );
INSERT INTO "special_bell_events" VALUES(4,2,'07:39:00.000000','Morning Bell (Adv)',13,NULL,'',1,'2025-09-02 01:23:58');
INSERT INTO "special_bell_events" VALUES(5,3,'07:39:00.000000','Morning Bell (ex)',5,NULL,NULL,1,'2025-09-02 23:14:01');
INSERT INTO "special_bell_events" VALUES(6,2,'07:43:20.000000','Morning Music (Adv)',14,NULL,'',1,'2025-09-05 02:17:14');
INSERT INTO "special_bell_events" VALUES(7,2,'07:45:00.000000','1st Period (Adv)',13,NULL,'',1,'2025-09-05 02:17:57');
INSERT INTO "special_bell_events" VALUES(8,2,'08:30:00.000000','End of 1st Period (Adv)',13,NULL,'',1,'2025-09-05 02:22:05');
INSERT INTO "special_bell_events" VALUES(9,2,'08:34:00.000000','2nd Period (Adv)',13,NULL,'',1,'2025-09-05 02:22:38');
INSERT INTO "special_bell_events" VALUES(10,2,'09:19:00.000000','End of 2nd Period (Adv)',13,NULL,'',1,'2025-09-05 02:23:15');
INSERT INTO "special_bell_events" VALUES(11,2,'09:23:00.000000','Advisory (Adv)',13,NULL,'',1,'2025-09-05 02:23:41');
INSERT INTO "special_bell_events" VALUES(12,2,'09:58:00.000000','End of Advisory (Adv)',13,NULL,'',1,'2025-09-05 02:24:27');
INSERT INTO "special_bell_events" VALUES(21,3,'12:57:00.000000','Test (Ext)',18,NULL,'',1,'2025-10-06 17:54:41');
CREATE TABLE special_schedule_dates (
	id INTEGER NOT NULL, 
	special_schedule_id INTEGER, 
	date DATE, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(special_schedule_id) REFERENCES special_schedules (id) ON DELETE CASCADE
);
CREATE TABLE special_schedule_days (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    special_schedule_id INTEGER NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (special_schedule_id) REFERENCES special_schedules (id) ON DELETE CASCADE
                );
INSERT INTO "special_schedule_days" VALUES(2,5,0,1,'2025-09-02 01:23:58');
INSERT INTO "special_schedule_days" VALUES(3,4,0,1,'2025-09-02 23:14:01');
CREATE TABLE "special_schedules" (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    schedule_id INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
                );
INSERT INTO "special_schedules" VALUES(4,'Extended 2nd Period','',3,1,'2025-09-02 00:45:19');
INSERT INTO "special_schedules" VALUES(5,'Advisory','',3,1,'2025-09-02 01:23:41');
CREATE TABLE system_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
INSERT INTO "system_settings" VALUES(1,'system_name','School Bell System','Name of the bell system',NULL);
INSERT INTO "system_settings" VALUES(2,'volume','100','System volume (0-100)',NULL);
INSERT INTO "system_settings" VALUES(3,'timezone','UTC','System timezone',NULL);
INSERT INTO "system_settings" VALUES(4,'audio_volume','85',NULL,'2025-08-29 04:05:42');
INSERT INTO "system_settings" VALUES(5,'audio_masterVolume','90',NULL,'2025-08-29 04:05:42');
INSERT INTO "system_settings" VALUES(8,'audio_output','alsa_card_1_device_0',NULL,'2025-10-08 14:15:21');
INSERT INTO "system_settings" VALUES(9,'audio_enabled','True',NULL,'2025-08-29 04:06:13');
INSERT INTO "system_settings" VALUES(10,'school_name','Foreman',NULL,'2025-09-07 22:14:11');
INSERT INTO "system_settings" VALUES(11,'school_logo','https://10.7.45.193/static/uploads/logo_20250918_112527_F_Logo.png',NULL,'2025-10-02 21:20:22');
INSERT INTO "system_settings" VALUES(12,'contact_email','info@foremancca.org',NULL,'2025-09-03 23:40:33');
INSERT INTO "system_settings" VALUES(13,'contact_phone','',NULL,'2025-09-01 21:09:58');
INSERT INTO "system_settings" VALUES(14,'footer_text','© 2025 Jerzy Knybel  |  3235 N Leclaire Ave, Chicago, IL, 60641',NULL,'2025-09-01 23:16:48');
INSERT INTO "system_settings" VALUES(15,'system_timezone','America/Chicago','System timezone','2025-09-04 02:09:00');
INSERT INTO "system_settings" VALUES(16,'auto_backup','True','Enable automatic backups','2025-09-04 02:09:00');
INSERT INTO "system_settings" VALUES(17,'backup_frequency','monthly','Backup frequency','2025-09-17 00:20:00');
INSERT INTO "system_settings" VALUES(18,'max_file_size','30',NULL,'2025-09-04 23:18:23');
INSERT INTO "system_settings" VALUES(20,'audio_eq_low','7',NULL,'2025-09-12 02:34:03');
INSERT INTO "system_settings" VALUES(21,'audio_eq_mid','4',NULL,'2025-09-01 21:10:43');
INSERT INTO "system_settings" VALUES(22,'audio_eq_high','3',NULL,'2025-08-29 01:55:01');
INSERT INTO "system_settings" VALUES(23,'audio_eq_bass','4',NULL,'2025-08-29 01:55:37');
INSERT INTO "system_settings" VALUES(24,'audio_eq_treble','5',NULL,'2025-08-29 01:55:01');
INSERT INTO "system_settings" VALUES(25,'audio_audio_sampleRate','44100',NULL,'2025-09-16 22:49:44');
INSERT INTO "system_settings" VALUES(26,'audio_audio_bitDepth','16',NULL,'2025-09-16 22:49:44');
INSERT INTO "system_settings" VALUES(27,'audio_audio_channels','2',NULL,'2025-09-13 16:31:32');
INSERT INTO "system_settings" VALUES(28,'audio_audio_bufferSize','1024',NULL,'2025-09-16 22:49:49');
INSERT INTO "system_settings" VALUES(30,'test_setting','test_value',NULL,NULL);
INSERT INTO "system_settings" VALUES(31,'test_audio_setting','test_value',NULL,NULL);
INSERT INTO "system_settings" VALUES(32,'schoolName','Foreman College & Career Academy',NULL,NULL);
INSERT INTO "system_settings" VALUES(33,'schoolLogo','/static/uploads/logo_20250901_154855_FCCA_Logo_PNG.png',NULL,NULL);
INSERT INTO "system_settings" VALUES(34,'contactEmail','',NULL,NULL);
INSERT INTO "system_settings" VALUES(35,'contactPhone','773-534-3552',NULL,NULL);
INSERT INTO "system_settings" VALUES(36,'footerText','3235 N. Leclaire Ave, Chicago, IL 60641 | 773-534-3552
@Jerzy Knybel',NULL,NULL);
INSERT INTO "system_settings" VALUES(37,'systemTimezone','America/Chicago',NULL,NULL);
INSERT INTO "system_settings" VALUES(38,'autoBackup','False',NULL,NULL);
INSERT INTO "system_settings" VALUES(39,'backupFrequency','daily',NULL,NULL);
INSERT INTO "system_settings" VALUES(40,'maxFileSize','10',NULL,NULL);
INSERT INTO "system_settings" VALUES(41,'allowedFileTypes','[''mp3'', ''wav'', ''ogg'']',NULL,NULL);
INSERT INTO "system_settings" VALUES(42,'ntp_enabled','True',NULL,NULL);
INSERT INTO "system_settings" VALUES(43,'ntp_servers','pool.ntp.org,time.nist.gov',NULL,NULL);
INSERT INTO "system_settings" VALUES(44,'ntp_sync_interval','3600',NULL,NULL);
INSERT INTO "system_settings" VALUES(45,'last_ntp_sync','{''server'': ''time.nist.gov'', ''offset'': -0.011520862579345703, ''delay'': 0.0038127899169921875, ''timestamp'': 1759936386.952117}',NULL,'2025-10-08 15:13:06');
INSERT INTO "system_settings" VALUES(46,'default_audio_input_device','default',NULL,'2025-09-18 15:40:24');
INSERT INTO "system_settings" VALUES(47,'audio_input','default',NULL,'2025-09-18 15:40:24');
INSERT INTO "system_settings" VALUES(48,'audio_inputEnabled','True',NULL,NULL);
INSERT INTO "system_settings" VALUES(49,'audio_pagingSound','13',NULL,'2025-09-16 23:03:37');
INSERT INTO "system_settings" VALUES(50,'audio_pagingSoundVolume','80',NULL,NULL);
INSERT INTO "system_settings" VALUES(51,'pagingPreSoundId','5',NULL,'2025-09-07 21:49:21');
INSERT INTO "system_settings" VALUES(52,'pagingPreSoundVolume','75',NULL,'2025-09-07 21:49:21');
INSERT INTO "system_settings" VALUES(53,'paging_pre_sound_id','13',NULL,'2025-09-16 23:03:37');
INSERT INTO "system_settings" VALUES(54,'paging_pre_sound_volume','80',NULL,'2025-09-07 22:14:47');
INSERT INTO "system_settings" VALUES(55,'allowed_file_types','[''[\''[\\\''[\\\\\\\''[\\\\\\\\\\\\\\\''[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''["[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''mp3\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\''\\\\\\\''\\\''\'''', '' \'' \\\'' \\\\\\\'' \\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' " \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''wav\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''\\\\\\\\\\\\\\\''\\\\\\\''\\\''\'''', '' \'' \\\'' \\\\\\\'' \\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'' " \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\''ogg\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\'']\\\\\\\\\\\\\\\'']\\\\\\\'']\\\'']\'']'']',NULL,'2025-10-02 21:20:22');
INSERT INTO "system_settings" VALUES(56,'paging_last_used_device_settings','{"device_id": "default", "sample_rate": 44100, "bit_depth": 16, "channels": 1}',NULL,NULL);
INSERT INTO "system_settings" VALUES(57,'audio_settings_complete','{"volume": 85, "masterVolume": 90, "eq": {"low": 7, "mid": 4, "high": 3, "bass": 4, "treble": 5}, "audio": {"sampleRate": 44100, "bitDepth": 16, "channels": 2, "bufferSize": 1024}, "output": "alsa_card_1_device_0", "input": "default", "inputEnabled": true, "pagingSound": "13", "pagingSoundVolume": 80, "enabled": true}',NULL,'2025-10-08 14:15:21');
INSERT INTO "system_settings" VALUES(58,'recording_default_mode','browser',NULL,NULL);
INSERT INTO "system_settings" VALUES(59,'recording_default_input_device','default',NULL,NULL);
CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	hashed_password VARCHAR NOT NULL, 
	is_active BOOLEAN, 
	is_admin BOOLEAN, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin','admin@school.com','$2b$12$AO9SA4ZdQIYrSlWMCzx4ou5CckPd4KgyX/bnE0zzfV7mVd50/NjAK',1,1,'2025-09-04 02:12:18',NULL);
INSERT INTO "users" VALUES(2,'testuser','test@school.com','$2b$12$ZtwxBaAinFrqTkGqsfumaOQBfUT9NEgNPaJWwEx4OqTLoyLTnl2fW',1,0,'2025-09-04 02:12:49','2025-09-04 02:48:34');
CREATE INDEX ix_sounds_id ON sounds (id);
CREATE UNIQUE INDEX ix_sounds_name ON sounds (name);
CREATE INDEX ix_schedules_name ON schedules (name);
CREATE INDEX ix_schedules_id ON schedules (id);
CREATE INDEX idx_schedule_days_schedule_id ON schedule_days(schedule_id);
CREATE INDEX idx_bell_events_schedule_day_id ON bell_events(schedule_day_id);
CREATE INDEX idx_bell_events_time ON bell_events(time);
CREATE INDEX ix_special_schedule_dates_date ON special_schedule_dates (date);
CREATE INDEX ix_special_schedule_dates_id ON special_schedule_dates (id);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE UNIQUE INDEX ix_users_email ON users (email);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('admin_users',1);
INSERT INTO "sqlite_sequence" VALUES('system_settings',59);
INSERT INTO "sqlite_sequence" VALUES('schedule_days',5);
INSERT INTO "sqlite_sequence" VALUES('bell_events',187);
INSERT INTO "sqlite_sequence" VALUES('special_schedules',6);
INSERT INTO "sqlite_sequence" VALUES('special_schedule_days',4);
INSERT INTO "sqlite_sequence" VALUES('special_bell_events',21);
COMMIT;
