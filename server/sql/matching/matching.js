export const insertMatching = `INSERT INTO employment (employer_id, mussem_id, start_date, status, employer_latitude,employer_longitude)
VALUES ($1, $2, NOW(), 'in_progress',$3,$4)
RETURNING id;`;

export const updateMatchingCanceled = `update employment set status='canceled' where id=$1`;

export const insertCancledInfo = `insert into employment_cancel (employment_id, reason,canceled_by_id,canceled_by_type) values($1,$2,$3,$4)`;
