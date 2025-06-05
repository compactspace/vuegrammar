// socket/eventHandler/employerEvents.js
import { redisClient } from "../../config/redis.js";

export default function registerEmployerEvents(socket) {
  socket.on("servant:list", async (region) => {
    const socketIds = await redisClient.sMembers(`region:${region}`);

    const servants = await Promise.all(
      socketIds.map(async (id) => {
        const raw = await redisClient.get(`servant:${id}`);
        return raw ? JSON.parse(raw) : null;
      })
    );

    socket.emit("servant:list:result", servants.filter(Boolean));
  });
}
