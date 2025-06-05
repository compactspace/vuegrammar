import { getMussemListService } from "../service/customerService.js";
import { getMussemInfoListModel } from "../model/mussemModel.js";
export const registerCustomerEvents = async (socket) => {
  socket.on("getMussemList", async (address) => {
    const activaingMussem = await getMussemListService(socket, address);

    let mussemList = [];
    if (activaingMussem.length != 0) {
      mussemList = await getMussemInfoListModel(activaingMussem);
    }

    socket.emit("mussemList", mussemList);
  });
};
