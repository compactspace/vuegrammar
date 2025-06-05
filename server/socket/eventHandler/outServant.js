import { redisClient } from "../../config/redis.js";

export const outServant = async (socket, servantInfo) => {
  // console.log("로그아웃은?");

  const socketId = socket.id;
  const region = servantInfo.regions;
  const email = servantInfo.email;
  const servantKey = `servant:${socketId}`;
  const regionSetKey = `region:${region}`;
  // console.log(servantInfo);

  const data = {
    region,
    email,
    socketId,
    joinedAt: Date.now(),
  };

  await redisClient.del(servantKey);

  // 2. 지역 set에서 socketId 제거
  await redisClient.sRem(`${regionSetKey}:members`, socketId);

  // 3. 해시에서도 제거 (socketId -> email mapping 제거)
  await redisClient.hDel(regionSetKey, socketId);
};
