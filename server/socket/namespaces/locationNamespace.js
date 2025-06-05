// socket/namespaces/locationNamespace.js
import registerServantEvents from "../eventHandler/registerServantEvents.js";
import registerEmployerEvents from "../eventHandler/employerEvents.js";

export const locationNamespace = (nsp) => {
  nsp.on("connection", (socket) => {
    console.log("📍 /location 접속:", socket.id);

    registerServantEvents(socket, nsp);
    registerEmployerEvents(socket, nsp);
  });
};
