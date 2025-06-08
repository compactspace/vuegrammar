export const retrySocketRegisterEvent = (socket, retrySocket) => {
  // 최악의 경우로 2가지 케이스로

  // 고용주, 머슴 둘다 로그아웃함

  // case1 고용주가 먼저 로그인후, 머슴은 로그인 하지 않거나, 뒤에 로그인함
  // 즉 이경우는 에러 처리이고,
  // 같은말로 고용주가 로그인이 되어있고, 나중 내가 로그인되었다면 돌아간다.
  socket.on("requestJoinRetryRoom", (data) => {
    for (const [id, s] of retrySocket.sockets) {
      if (id != socket.id && s.data?.role === "mussem") {
        console.log(`id: ${id}  socket.id:${socket.id} `);

        console.log(`머슴 이메일 ID: ${JSON.stringify(s.data)}`);
        // 여기서 원하는 로직 실행
        const email = s.data.email;
        const clientSocket = socket;
        s.emit("acceptRequest", { email: email }); // 올바른 사용

        return;
      }
    }

    socket.emit("notFoundMussem", {
      notFoundMussem: "해당 머슴이 아직 접속중입니다.",
    });
  });

  socket.on("acceptRequest", (data) => {
    for (const [id, s] of retrySocket.sockets) {
      if (s.data?.role === "customer") {
        s.join(`retry_${data.email}`);
        retrySocket.to(id).emit("successRequest", { retryJoinRoom: "success" });
      }
    }
  });

  //case2
  //이는 머슴이 방은 먼저 만들고 직접 고용주에게 보낸다.
  socket.on("createRetryRoom", (data) => {
    const mussemEmail = socket.data.email;
    const employer_id = socket.data.employer_id;

    console.log(`mussemEmail: ${mussemEmail} employer_id:${employer_id} `);

    socket.join(`retry_${mussemEmail}`);

    for (const [id, s] of retrySocket.sockets) {
      if (s.data?.role === "customer") {
        s.join(`retry_${mussemEmail}`); // ✅ 고용주 소켓을 방에 참여시킴
        retrySocket
          .to(id)
          .emit(`retry_target_${employer_id}`, { retryJoinRoom: "success" });
        return;
      }
    }
  });

  /**
 @param location={ lat: latitude, lon: longitude }
*/
  socket.on("mussemLocationUpdate", (location) => {
    console.log(location);
    const mussemRoom = socket.data.email; // 예: "match_customerEmail_mussemEmail"
    console.log(`mussemRoom: ${mussemRoom}`);
    if (!mussemRoom) {
      console.log("배달부 매칭 방이 없습니다.");
      return;
    }

    // 매칭 방 내 소켓 중 고객(role="customer")만 골라서 위치 전달
    const roomMembers = retrySocket.adapter.rooms.get(`retry_${mussemRoom}`);
    console.log(roomMembers);
    if (!roomMembers) return;

    for (const clientId of roomMembers) {
      const clientSocket = retrySocket.sockets.get(clientId);
      console.log(clientSocket.data);
      if (clientSocket && clientSocket.data?.role === "customer") {
        clientSocket.emit("mussemLocation", location);
      }
    }

    // 선택사항: 배달부 자신도 위치 저장
    socket.data.latestLocation = location;
  });
};
