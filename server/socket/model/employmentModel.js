import pgPool from "../../config/postgres.js";
import {
  insertMatching,
  updateMatchingCanceled,
  insertCancledInfo,
} from "../../sql/matching/matching.js";

export const insertMatchingModel = async (matchingData) => {
  const { employer_id, mussem_id, employer_latitude, employer_longitude } =
    matchingData;
  const client = await pgPool.connect(); //
  let result;
  try {
    result = await client.query(insertMatching, [
      employer_id,
      mussem_id,
      employer_latitude,
      employer_longitude,
    ]);
    console.log(result);
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
    return result.rows[0]?.id; // 새로 생성된 employment ID
  }
};

/**
 *
 * @param {} data
 * @returns
 */

export const updateMatchingCanceledModel = async (data) => {
  const { employment_id } = data;
  const client = await pgPool.connect(); //
  let result;
  try {
    result = await client.query(updateMatchingCanceled, [employment_id]);

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

export const insertCancledInfoModel = async (data) => {
  const { employment_id, reason, canceled_by_id, canceled_by_type } = data;
  const client = await pgPool.connect(); //
  let result;
  try {
    result = await client.query(insertCancledInfo, [
      employment_id,
      reason,
      canceled_by_id,
      canceled_by_type,
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
