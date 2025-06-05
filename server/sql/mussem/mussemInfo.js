export const MussemInfoList = `select * from users as u inner join  mussem as m on u.id=m.user_id where u.email=$1`;
