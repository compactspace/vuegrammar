export const getTermList = `select * From terms as t inner join  term_versions as tv on t.id=tv.term_id`;

// sqlQueries.js
// sqlQueries.js
export const checkEmailExistsQuery = `
  SELECT EXISTS (
    SELECT 1 FROM users WHERE email = $1
  ) AS "exists"
`;
export const createUser = `insert into users (email,password_hash) values($1,$2)`;

export const getId = `select id  from users where email = $1`;

export const createMussem = `insert into mussem (user_id,license_num,vehicle_type,active_regions) values($1,$2,$3,$4)`;

export const crateRole = `insert into user_roles (user_id,role) values($1,$2)`;


// 쫌잇다가 약관 인설트를 추가하자. ㅈㄴ 귀찮네
export const insertAgreements=`insert into user_term_agreements (user_id,term_version_id) values($1,$2) `
