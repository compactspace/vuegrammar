/**
 *
 * @param {nameSpaceObject} nameSpace
 * @returns void
 * @example  const nameSpace=io.of("/user'sName")
 */

const printAllSocketSummary = (nameSpace) => {
  console.log(`\n⬇️⬇️⬇️🌐 [현재 ${nameSpace.name} 전체 소켓 요약] ⬇️⬇️⬇️`);

  if (nameSpace.sockets.size === 0) {
    console.log("❗ 현재 연결된 소켓이 없습니다.");
    return;
  }

  for (const [sockId, socket] of nameSpace.sockets) {
    const role = socket.data?.role || "unknown";
    const roomId = socket.data?.roomId || "none";
    console.log(`- ${sockId} | role: ${role} | roomId: ${roomId}`);
  }

  console.log(`⬆️⬆️⬆️🌐 [${nameSpace.name} 소켓 요약 끝] ⬆️⬆️⬆️`);
};

// 방별 소켓 참여자 리스트 보기
/**
 *
 * @param {nameSpaceObject} nameSpace
 * @returns void
 * @example  const nameSpace=io.of("/user'sName")
 */

const printRoomsAndMembers = (nameSpace) => {
  console.log("\n📦 [활성 방 목록 및 멤버 정보]");
  const rooms = nameSpace.adapter.rooms;

  if (rooms.size === 0) {
    console.log("❗ 현재 존재하는 방이 없습니다.");
    return;
  }

  for (const [roomId, clients] of rooms) {
    // rooms Map은 roomId와 Set<socket.id>를 가지고 있음
    // 단, socket.id도 roomId로 사용되기 때문에 필터링 필요
    if (nameSpace.sockets.has(roomId)) continue; // socket.id인 경우 skip

    console.log(`🏠 방: "${roomId}" | 참여자 수: ${clients.size}`);
    for (const clientId of clients) {
      const clientSocket = nameSpace.sockets.get(clientId);
      const role = clientSocket?.data?.role || "unknown";
      console.log(`  └─ 👤 소켓 ID: ${clientId} | 역할: ${role}`);
    }
  }
};

export default { printAllSocketSummary, printRoomsAndMembers };
