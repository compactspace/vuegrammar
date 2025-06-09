export const getDefaultChatList = `
     SELECT ec.sender_id, ec.message, ec.sent_at, ur.role
FROM employment_chat ec
LEFT JOIN user_roles ur ON ec.sender_id = ur.user_id
WHERE ec.employment_id =$1
ORDER BY ec.sent_at ASC, ec.id ASC;
    `;

export const insertChat = `
insert into employment_chat (employment_id,sender_id,message ) values($1,$2,$3);
    `;
