-- Clean schema for Coding Quiz Platform.
-- Import this file into MySQL/MariaDB database `coding_quiz` to start with fresh data.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `submission_attempts`;
DROP TABLE IF EXISTS `question_solves`;
DROP TABLE IF EXISTS `competition_students`;
DROP TABLE IF EXISTS `attempts`;
DROP TABLE IF EXISTS `competition_status`;
DROP TABLE IF EXISTS `external_questions`;
DROP TABLE IF EXISTS `competition_sessions`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(255) NOT NULL,
  `admin_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `external_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `input_sample` text DEFAULT NULL,
  `output_sample` text DEFAULT NULL,
  `example_input` text DEFAULT NULL,
  `example_output` text DEFAULT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'cpp',
  `test_cases` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `competition_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL DEFAULT 'مسابقة البرمجة',
  `description` text DEFAULT NULL,
  `duration_seconds` int(11) NOT NULL DEFAULT 600,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session_time` (`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `competition_students` (
  `session_id` int(11) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `status` enum('assigned','started','finished','locked') NOT NULL DEFAULT 'assigned',
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  PRIMARY KEY (`session_id`,`student_id`),
  KEY `idx_competition_students_student` (`student_id`),
  CONSTRAINT `fk_comp_student_session` FOREIGN KEY (`session_id`) REFERENCES `competition_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_student_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `competition_status` (
  `id` int(11) NOT NULL,
  `is_started` tinyint(1) NOT NULL DEFAULT 0,
  `start_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `score` int(11) NOT NULL DEFAULT 0,
  `total_questions` int(11) NOT NULL DEFAULT 0,
  `percentage` float NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_time` datetime DEFAULT current_timestamp(),
  `end_time` datetime DEFAULT NULL,
  `time_spent` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_attempts_student` (`student_id`),
  CONSTRAINT `fk_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `question_solves` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) DEFAULT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `question_index` int(11) DEFAULT NULL,
  `time_spent` int(11) DEFAULT NULL,
  `solved_at` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_solve_session_student` (`session_id`,`student_id`),
  KEY `idx_solve_question` (`session_id`,`student_id`,`question_id`),
  KEY `idx_solve_created_at` (`created_at`),
  KEY `fk_solve_student` (`student_id`),
  KEY `fk_solve_question` (`question_id`),
  CONSTRAINT `fk_solve_session` FOREIGN KEY (`session_id`) REFERENCES `competition_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solve_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solve_question` FOREIGN KEY (`question_id`) REFERENCES `external_questions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `submission_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `question_index` int(11) NOT NULL DEFAULT 0,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `verdict` varchar(40) NOT NULL DEFAULT 'pending',
  `source_filename` varchar(255) DEFAULT NULL,
  `judge_log` mediumtext DEFAULT NULL,
  `time_spent` int(11) DEFAULT 0,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_attempt_session_student` (`session_id`,`student_id`),
  KEY `idx_attempt_question` (`session_id`,`student_id`,`question_id`),
  KEY `idx_attempt_time` (`submitted_at`),
  KEY `fk_attempt_student` (`student_id`),
  KEY `fk_attempt_question` (`question_id`),
  CONSTRAINT `fk_attempt_session` FOREIGN KEY (`session_id`) REFERENCES `competition_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attempt_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_attempt_question` FOREIGN KEY (`question_id`) REFERENCES `external_questions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `competition_status` (`id`, `is_started`, `start_time`) VALUES
(1, 0, NULL);

COMMIT;
