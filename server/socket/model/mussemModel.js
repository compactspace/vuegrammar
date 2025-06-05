import pgPool from "../../config/postgres.js";
import { MussemInfoList } from "../../sql/mussem/mussemInfo.js";
export const getMussemInfoListModel = async (activaingMussem) => {
  const client = await pgPool.connect();

  let mussemInfoList = [];
  try {
    for (let k = 0; k < activaingMussem.length; k++) {
      mussemInfoList.push(
        await client.query(MussemInfoList, [activaingMussem[k]])
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.release();

    return mussemInfoList;
  }
};
