export const insertMatching = `INSERT INTO employment (employer_id, mussem_id, start_date, status, employer_latitude,employer_longitude)
VALUES ($1, $2, NOW(), 'in_progress',$3,$4)
RETURNING id;`;
