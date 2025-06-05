import { redisClient } from "../../config/redis.js";

export const getMussemListService = async (socket, address) => {
  const result = await redisClient.hGetAll(`region:${address}`);

  let toArray = Object.values(result);
  // console.log(toArray);
  return toArray;
};
