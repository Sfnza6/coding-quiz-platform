-- Database update for competition sessions and attempt-based scoring.
-- Run this on the coding_quiz database before the final graduation-project demo.
--
-- الهدف:
-- 1. حفظ كل مسابقة في جدول مستقل.
-- 2. تسجيل كل محاولة رفع كود وربطها بالمسابقة والطالب.
-- 3. ربط الحلول الصحيحة بالمسابقة مباشرة بدل الاعتماد على نطاق الوقت فقط.
-- 4. إضافة فهارس وعلاقات تجعل قاعدة البيانات أوضح وأسهل في التوثيق.

CREATE TABLE IF NOT EXISTS competition_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_session_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS submission_attempts (
  id INT NOT NULL AUTO_INCREMENT,
  session_id INT NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) DEFAULT NULL,
  question_index INT NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  time_spent INT DEFAULT 0,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attempt_session_student (session_id, student_id),
  KEY idx_attempt_question (session_id, student_id, question_index),
  KEY idx_attempt_time (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELIMITER //

CREATE PROCEDURE apply_competition_scoring_schema()
BEGIN
  -- اجعل رقم الطالب في الحلول متوافقا مع جدول students حتى يمكن إضافة علاقة FK.
  ALTER TABLE question_solves
    MODIFY student_id VARCHAR(255) NULL;

  -- ربط الحلول الصحيحة بجلسة المسابقة.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'question_solves'
      AND COLUMN_NAME = 'session_id'
  ) THEN
    ALTER TABLE question_solves
      ADD COLUMN session_id INT NULL AFTER id;
  END IF;

  -- ترحيل الحلول القديمة وربطها بأقرب مسابقة حسب وقت الحل.
  UPDATE question_solves q
  LEFT JOIN competition_sessions c
    ON q.created_at >= c.start_time
    AND q.created_at <= COALESCE(c.end_time, NOW())
  SET q.session_id = c.id
  WHERE q.session_id IS NULL;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'question_solves'
      AND INDEX_NAME = 'idx_solve_session_student'
  ) THEN
    CREATE INDEX idx_solve_session_student
      ON question_solves (session_id, student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'question_solves'
      AND INDEX_NAME = 'idx_solve_question'
  ) THEN
    CREATE INDEX idx_solve_question
      ON question_solves (session_id, student_id, question_index);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'question_solves'
      AND INDEX_NAME = 'idx_solve_created_at'
  ) THEN
    CREATE INDEX idx_solve_created_at
      ON question_solves (created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_attempt_session'
  ) THEN
    ALTER TABLE submission_attempts
      ADD CONSTRAINT fk_attempt_session
      FOREIGN KEY (session_id)
      REFERENCES competition_sessions(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_attempt_student'
  ) THEN
    ALTER TABLE submission_attempts
      ADD CONSTRAINT fk_attempt_student
      FOREIGN KEY (student_id)
      REFERENCES students(student_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_solve_session'
  ) THEN
    ALTER TABLE question_solves
      ADD CONSTRAINT fk_solve_session
      FOREIGN KEY (session_id)
      REFERENCES competition_sessions(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'fk_solve_student'
  ) THEN
    ALTER TABLE question_solves
      ADD CONSTRAINT fk_solve_student
      FOREIGN KEY (student_id)
      REFERENCES students(student_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END//

DELIMITER ;

CALL apply_competition_scoring_schema();
DROP PROCEDURE apply_competition_scoring_schema;
