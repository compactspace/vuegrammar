import { redisClient } from "../../config/redis.js";

/**
 * servantInfo = {
 *   regions: '서울특별시',
 *   email: 'younggoo7000@na'
 * }
 */
export const registerServant = async (socket, servantInfo) => {
  const region = servantInfo.regions;
  const email = servantInfo.email;

  //console.log(`region: ${region}    email: ${email}`);

  const socketId = socket.id;
  const servantKey = `servant:${socketId}`;
  const regionSetKey = `region:${region}`;

  const data = {
    region,
    email,
    socketId,
    joinedAt: Date.now(),
  };

  // 1. 개별 소켓 정보 저장 (TTL 60초)
  await redisClient.set(servantKey, JSON.stringify(data), { EX: 60 });

  // Set에는 socketId 저장
  await redisClient.sAdd(`region:${region}:members`, socketId);

  // Hash에는 socketId → email 저장
  await redisClient.hSet(`region:${region}`, socketId, servantInfo.email);

  // 4. TTL 유지 (소켓 지속 연결 전제)
  const ttlInterval = setInterval(async () => {
    if (await redisClient.exists(servantKey)) {
      await redisClient.expire(servantKey, 60);
    }
  }, 30000);

  // 5. 소켓 연결 종료 시 데이터 정리
  socket.on("disconnect", async () => {
    clearInterval(ttlInterval);

    // 1. 소켓 정보 키 삭제
    await redisClient.del(servantKey);

    // 2. 지역 set에서 socketId 제거 → 키명 수정!
    await redisClient.sRem(`region:${region}:members`, socketId);

    // 3. 해시에서도 제거 (socketId -> email mapping 제거)
    await redisClient.hDel(regionSetKey, socketId);
  });
};
