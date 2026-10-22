-- Recover participation for older sessions that did not record started_at.
-- A preassigned row alone is not proof that the student entered the challenge.
UPDATE competition_students cs
SET cs.started_at = COALESCE(
  (SELECT MIN(a.submitted_at) FROM submission_attempts a
   WHERE a.session_id = cs.session_id AND a.student_id = cs.student_id),
  (SELECT MIN(q.created_at) FROM question_solves q
   WHERE q.session_id = cs.session_id AND q.student_id = cs.student_id),
  cs.finished_at
)
WHERE cs.started_at IS NULL
  AND (
    cs.status = 'finished'
    OR EXISTS (SELECT 1 FROM submission_attempts a
               WHERE a.session_id = cs.session_id AND a.student_id = cs.student_id)
    OR EXISTS (SELECT 1 FROM question_solves q
               WHERE q.session_id = cs.session_id AND q.student_id = cs.student_id)
  );

UPDATE competition_students cs
SET cs.status = 'started'
WHERE cs.status = 'assigned'
  AND cs.started_at IS NOT NULL;
