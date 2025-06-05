export const insertMatching = `INSERT INTO employment (employer_id, mussem_id, start_date, status)
VALUES ($1, $2, NOW(), 'in_progress')
RETURNING id;`;
