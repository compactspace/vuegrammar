export const findUser = `select * from users where email=$1`;

export const loginInfo = `
select * from users as u

inner join user_roles as ur

on u.id=ur.user_id  where email=$1
`;

export const mussemActiveArea = `select m.active_regions from users as u inner join  mussem as m on u.id=m.user_id  where u.email=$1`;

export const employInfoForMussem = `
select * from mussem as m inner join employment as e on m.user_id=e.mussem_id where e.mussem_id=$1  and e.status='in_progress';
`;

export const employInfoForCustomer = `
select * from mussem as m inner join employment as e on m.user_id=e.mussem_id where e.employer_id=$1  and e.status='in_progress';
`;
