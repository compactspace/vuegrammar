import pgPool from "../../config/postgres.js";
import { insertMatching } from "../../sql/matching/matching.js";

export const insertMatchingModel = async (matchingData) => {
  const { employer_id, mussem_id, employer_latitude, employer_longitude } =
    matchingData;
  const client = await pgPool.connect(); //
  let result;
  try {
    result = await client.query(insertMatching, [employer_id, mussem_id, employer_latitude,employer_longitude]);
    console.log(result);
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
    return result.rows[0]?.id; // 새로 생성된 employment ID
  }
};
