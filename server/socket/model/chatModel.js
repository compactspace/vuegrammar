import pgPool from "../../config/postgres.js";
import { insertChat } from "../../sql/chat/chat.js";

export const insertChatModel = async (chatData) => {
  const { employment_id, message, sender_id } = chatData;
  const client = await pgPool.connect(); //
  let result;
  try {
    result = await client.query(insertChat, [
      employment_id,
      sender_id,
      message,
    ]);

    console.log("------------------");
    console.log(result);
    console.log("------------------");
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
    return 1; // 새로 생성된 employment ID
  }
};
