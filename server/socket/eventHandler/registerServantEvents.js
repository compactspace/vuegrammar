// socket/eventHandler/servantEvents.js
import { registerServant } from "../service/servantService.js";
import { outServant } from "./outServant.js";
export const registerServantEvents = async (socket) => {
  socket.on("servant:join", async (servantInfo) => {
    await registerServant(socket, servantInfo);
  });
  socket.on("servant:out", async (servantInfo) => {
    await outServant(socket, servantInfo);
  });
};
