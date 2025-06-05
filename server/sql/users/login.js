export const findUser = `select * from users where email=$1`;

export const loginInfo = `
select * from users as u

inner join user_roles as ur

on u.id=ur.user_id  where email=$1
`;

export const mussemActiveArea = `select m.active_regions from users as u inner join  mussem as m on u.id=m.user_id  where u.email=$1`;
