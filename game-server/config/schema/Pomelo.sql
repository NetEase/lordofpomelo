# Dump of table Bag
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Bag` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `playerId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `items` varchar(5000) COLLATE utf8_unicode_ci NOT NULL DEFAULT '{}',
  `itemCount` smallint(6) unsigned DEFAULT '8',
  PRIMARY KEY (`id`),
  KEY `INDEX_PLAYER_ID` (`playerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Equipments
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Equipments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `playerId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `weapon` smallint(6) unsigned DEFAULT '0',
  `armor` smallint(6) unsigned DEFAULT '0',
  `helmet` smallint(6) unsigned DEFAULT '0',
  `necklace` smallint(6) unsigned DEFAULT '0',
  `ring` smallint(6) unsigned DEFAULT '0',
  `belt` smallint(6) unsigned DEFAULT '0',
  `shoes` smallint(6) unsigned DEFAULT '0',
  `amulet` smallint(6) DEFAULT NULL,
  `legguard` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `INDEX_PLAYER_ID` (`playerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table FightSkill
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `FightSkill` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `playerId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `skillId` smallint(6) unsigned DEFAULT '0',
  `level` smallint(6) unsigned DEFAULT '0',
  `type` varchar(20) COLLATE utf8_unicode_ci DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `INDEX_PLAYER_ID` (`playerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Player
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Player` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `kindId` varchar(10) COLLATE utf8_unicode_ci DEFAULT '0002',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `country` smallint(6) unsigned DEFAULT '0',
  `rank` smallint(6) unsigned DEFAULT '1' COMMENT 'dfsfds',
  `level` smallint(6) unsigned DEFAULT '1',
  `experience` smallint(11) unsigned DEFAULT '0',
  `attackValue` smallint(6) unsigned DEFAULT '0',
  `defenceValue` smallint(6) unsigned DEFAULT '0',
  `hitRate` smallint(6) unsigned DEFAULT '0',
  `dodgeRate` smallint(6) unsigned DEFAULT '0',
  `walkSpeed` smallint(6) unsigned DEFAULT '0',
  `attackSpeed` smallint(6) unsigned DEFAULT '0',
  `hp` smallint(6) unsigned DEFAULT '0',
  `mp` smallint(6) unsigned DEFAULT '0',
  `maxHp` smallint(6) unsigned DEFAULT '0',
  `maxMp` smallint(6) unsigned DEFAULT '0',
  `areaId` bigint(20) unsigned DEFAULT '1',
  `x` int(10) unsigned DEFAULT '0',
  `y` int(10) unsigned DEFAULT '0',
  `kindName` varchar(30) COLLATE utf8_unicode_ci DEFAULT 'god soilder',
  `skillPoint` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_GAME_NAME` (`name`),
  KEY `INDEX_PALYER_USER_ID` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table Task
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Task` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `playerId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `kindId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `taskState` smallint(6) unsigned DEFAULT '0',
  `startTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `taskData` varchar(1000) COLLATE utf8_unicode_ci DEFAULT '{}',
  PRIMARY KEY (`id`),
  KEY `INDEX_TASK_ID` (`playerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Dump of table User
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `User` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(50) COLLATE utf8_unicode_ci DEFAULT '',
  `loginCount` smallint(6) unsigned DEFAULT '0',
  `from` varchar(25) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lastLoginTime` bigint(20) unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_ACCOUNT_NAME` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

