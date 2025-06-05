import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
//나중 let's encrypt 에서 인증서 발급받으면 https 를 적용하라.
dotenv.config();
import https from "https";
//개발중이니 http를 사용한다.
import http from "http";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import { registerServantEvents } from "../eventHandler/registerServantEvents.js";
import { registerCustomerEvents } from "../eventHandler/registerCustomerEvents.js";
//나중 let's encrypt 에서 인증서 발급받으면 https 를 적용하라

import { insertMatchingModel } from "../model/employmentModel.js";

const options = {
  key: fs.readFileSync("C:/Windows/System32/localhost-key.pem"),
  cert: fs.readFileSync("C:/Windows/System32/localhost.pem"),
};

const app = express();
//나중 let's encrypt 에서 인증서 발급받으면 https 를 적용하라.
const socketServer = https.createServer(options, app);

//const socketServer = http.createServer(app);
const IP = process.env.ALLOW_IP;
// console.log(`IP: ${IP}`);
const allowedOrigins = [
  `https://${IP}:5173`,
  `https://localhost:5173`,
  `http://${IP}:5173`,
  `http://localhost:5173`,
];
const io = new Server(socketServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export const createSocketServer = () => {
  socketServer.listen(5000, function () {});
};

//현재 접속중인 머슴 네임스페이스
const locattion = io.of("/activeMussem");
locattion.on("connection", async (socket) => {
  connectedClients.add(socket.id);

  //logActiveState("activeMussem", "CONNECTED", socket);

  socket.on("activeMussem", (data) => {
    const { role } = data;

    // console.log(`네임스페이스: activeMussem  권한: ${role}`);
    switch (role) {
      case "mussem":
        registerServantEvents(socket);
        break;
      case "customer":
        registerCustomerEvents(socket);
        break;
    }
  });
});

//현재 접속중인 머슴 이 방을 만드는 네임스페이스
const activitingLocation = io.of("/activitingLocation");

activitingLocation.on("connection", (socket) => {
  // 기본 등록 시 role 없이
  connectedactivitingLocation.set(socket.id, { role: null });
  printConnectedactivitingLocation();
  //logActiveState("activitingLocation", "CONNECTED", socket);

  // 1. 방 생성: 머슴의 아이디=email로 생성 (mussem 전용)
  socket.on("createRoom", (data, callback) => {
    const { role, roomId } = data;
    const record = connectedactivitingLocation.get(socket.id);
    connectedactivitingLocation.set(socket.id, { role: data.role });

    printConnectedactivitingLocation();

    // console.log(data);
    /// console.log(role, roomId);

    socket.join(roomId);
    socket.data = { role, roomId };
    // logJoin(socket, "createRoom");

    //console.log(`🏠 Mussem(${socket.id}) created room: ${roomId}`);
    callback({ roomId });
  });

  // 2. 역할에 이벤트 등록과 그에 따른 이벤트  기능
  socket.on("activitingLocationRole", (data) => {
    // console.log(
    //   `고객이 룸입장시도: ${JSON.stringify(data)} 그리고 소캣아이디: ${
    //     socket.id
    //   }`
    // );

    const { role, roomId, clientId } = data;
    socket.data = { role, roomId, clientId };
    if (!roomId) return;
    if (role != "mussem") {
      socket.join(roomId);

      const record = connectedactivitingLocation.get(socket.id);
      connectedactivitingLocation.set(socket.id, { role: data.role });
      printConnectedactivitingLocation();
      // console.log(`초기화가 않되나?  ${JSON.stringify(socket.data)}`);

      // logJoin(socket, "activitingLocationRole");
    }

    // if (role === "mussem")  3가지 를 상정한다.
    // case1: eventName=toClient "머슴은 활동하기 버튼 클릭시 emit("fromMussem")로 자동 브로드 케스트

    // case2: eventName=sendLocationToCustomer 의 요청한 유저에게만  emit("fromMussem")로

    // case3: eventName=requestLocation   주로 고용주가 1차/2차/3차 행정구역 조회 버튼 클릭시 콜백으로 처리된다.

    if (role === "mussem") {
      socket.on("toClient", (locationData) => {
        const roomId = socket.data.roomId;
        const toClientData = { location: locationData, roomId: roomId };
        console.error("toClient");
        activitingLocation.to(roomId).emit("fromMussem", toClientData);
      });

      socket.on("sendLocationToCustomer", ({ to, location }) => {
        console.log(
          "고객의 요청을 고객 뷰페이지를 거쳐 익스프레스를 거처 머슴 페이지에서 받음은 걸 다시 익스프레스로 받음"
        );
        const roomId = socket.data.roomId;
        const toClientData = { location: location, roomId: roomId };
        const targetSocket = activitingLocation.sockets.get(to);
        if (targetSocket) {
          targetSocket.emit("fromMussem", toClientData);
        }
      });

      socket.on("requestLocation", ({ to }) => {
        console.log("customer의 요청을 받음");
        const currentLocation = socket.data?.latestLocation;

        if (currentLocation) {
          const targetSocket = activitingLocation.sockets.get(to);
          if (targetSocket) {
            targetSocket.emit("fromMussem", currentLocation);
          }
        }
      });
    }

    // 고객이 입장하면 => 해당 방에 머슴에게 위치 요청
    if (role === "customer") {
      //커스터머가 속한 룸아이디로 방객체를 가저온다.
      const room = activitingLocation.adapter.rooms.get(roomId);

      if (room) {
        for (const clientId of room) {
          const clientSocket = activitingLocation.sockets.get(clientId);

          // console.log(
          //   `clientSocket.id:${clientSocket.id} socket.id:${
          //     socket.id
          //   } clientSocket.data: ${JSON.stringify(clientSocket.data)}`
          // );

          if (
            clientSocket &&
            clientSocket.id != socket.id &&
            clientSocket.data?.role === "mussem"
          ) {
            // ✅ 머슴에게 이 고객에게 위치 보내라고 요청

            // console.log(`찾은 socket.id:  ${socket.id}`);
            clientSocket.emit("requestLocation", { to: socket.id });
            break; // 하나만 요청
          }
        }
      }
    }
  });

  // 3. 위치 정보 저장 (선택사항)
  socket.on("saveMyLocation", (location) => {
    socket.data.latestLocation = location;
  });

  socket.on("disconnect", () => {
    printConnectedactivitingLocation();
    connectedactivitingLocation.delete(socket.id);
    console.clear();
    console.log(`❌ [해제] 클라이언트 연결 해제: ${socket.id}`);
    // console.log(`🛑 사유: ${reason}`);
    const role = socket.data?.role || "unknown";
    const roomId = socket.data?.roomId || "none";

    // console.log(
    //   `❌ Socket disconnected: ${socket.id} (role: ${role}, roomId: ${roomId})`
    // );

    // 1. 현재 네임스페이스 내 모든 연결된 소켓
    console.log("📡 현재 /activitingLocation 네임스페이스의 연결된 소켓 목록:");
    for (const [id, s] of activitingLocation.sockets) {
      console.log(
        `- ${id} (role: ${s.data?.role || "unknown"}, roomId: ${
          s.data?.roomId || "none"
        })`
      );
    }

    // 2. 해당 socket.data.roomId 에 남아 있는 클라이언트 목록
    if (roomId && activitingLocation.adapter.rooms.has(roomId)) {
      const roomMembers = activitingLocation.adapter.rooms.get(roomId);
      console.log(`🏠 방 "${roomId}"의 남은 유저 목록:`);
      for (const clientId of roomMembers) {
        console.log(`-- 클라이언트 ID: ${clientId}`);
      }
    } else {
      console.log(
        `⚠️ 방 "${roomId}"는 더 이상 존재하지 않음 (모든 유저 나감).`
      );
    }
  });

  socket.on(
    "hireRequest",
    ({ toMussemEmail, fromCustomerEmail, customerPk }) => {
      hireRequestLog(toMussemEmail, fromCustomerEmail, customerPk);

      //주의: 최초 컨넥션이 머슴 인경우에 한하여 s.data?.roomId 을 삽입하고
      // customer 인경우는 애초에 넣지 않고있으니 다음은 정확히 머슴 소켓을 찾는것임
      // 즉 소캣을 찾아 리턴함
      socket.data.customerPk = customerPk;
      const mussemSocket = [...activitingLocation.sockets.values()].find(
        (s) => s.data?.role === "mussem" && s.data?.roomId === toMussemEmail
      );

      if (mussemSocket) {
        mussemSocket.emit("receiveHireRequest", {
          fromCustomerEmail,
          customerPk,
        });
        socket.emit("hireRequestSent", { to: toMussemEmail });
      } else {
        socket.emit("hireRequestFailed", {
          message: "해당 머슴이 접속 중이 아닙니다.",
        });
      }
    }
  );

  // 머슴이 수락 버튼 클릭시
  //step1: 수락  방을 만든다.
  //step2: 기존 네임스페이스 객체에서 조건에 만든 클라이언트 소켓 객체를 찾는다.
  //step3: 찾았다면 그 클라이언트 소캣객체에를 수락방이 입장시킨다.
  socket.on(
    "acceptHireRequest",
    ({ fromCustomerEmail, myRoomId, mussemPk }) => {
      console.log(
        `고용주 이메일: ${fromCustomerEmail} 을  현재룸: ${myRoomId}에서  수락`
      );
      const roomId = `match_${fromCustomerEmail}_${socket.data.roomId}`;
      socket.join(roomId);
      socket.data.matchRoomId = roomId;
      socket.data.mussemPk = mussemPk;
      //ReslonseLog(activitingLocation.sockets.values());

      const customerSocket = [...activitingLocation.sockets.values()].find(
        (s) =>
          s.data?.role === "customer" &&
          s.data?.roomId === myRoomId &&
          s.data?.clientId === fromCustomerEmail
      );
      // console.log(customerSocket);
      if (customerSocket) {
        customerSocket.join(roomId);
        // 고객 소켓에도 매칭 방 저장
        console.log(customerSocket.data);
        let matchingData = {
          employer_id: customerSocket.data.customerPk,
          mussem_id: mussemPk,
        };

        console.log(matchingData);

        insertMatchingModel(matchingData);

        customerSocket.data.matchRoomId = roomId;
        customerSocket.emit("hireAccepted", {
          mussemEmail: socket.data.roomId,
          roomId,
        });

        socket.emit("hireAccepted", {
          customerEmail: fromCustomerEmail,
          roomId,
        });

        activitingLocation.emit("mussemStatusChanged", {
          email: socket.data.roomId,
          is_working: true,
        });
      }
    }
  );

  socket.on("rejectHireRequest", ({ fromCustomerEmail }) => {
    console.log(`고용주 이메일: ${fromCustomerEmail} 을 거절`);
    const customerSocket = [...activitingLocation.sockets.values()].find(
      (s) => s.data?.role === "customer" && s.data?.roomId === fromCustomerEmail
    );

    if (customerSocket) {
      customerSocket.emit("hireRejected", {
        mussemEmail: socket.data.roomId,
      });
    }
  });

  socket.on("mussemLocationUpdate", (location) => {
    console.log(`location:  ${JSON.stringify(location)}`);
    console.log(`socket.data:  ${JSON.stringify(socket.data)}`);
    const mussemRoom = socket.data.matchRoomId; // 예: "match_customerEmail_mussemEmail"
    if (!mussemRoom) {
      console.log("배달부 매칭 방이 없습니다.");
      return;
    }

    // 매칭 방 내 소켓 중 고객(role="customer")만 골라서 위치 전달
    const roomMembers = activitingLocation.adapter.rooms.get(mussemRoom);
    if (!roomMembers) return;

    for (const clientId of roomMembers) {
      const clientSocket = activitingLocation.sockets.get(clientId);
      if (clientSocket && clientSocket.data?.role === "customer") {
        clientSocket.emit("mussemLocation", location);
      }
    }

    // 선택사항: 배달부 자신도 위치 저장
    socket.data.latestLocation = location;
  });
});

const logActiveState = (nameSpace, eventType, socket) => {
  const role = socket.data?.role || "unknown";
  const roomId = socket.data?.roomId || "none";

  console.log(
    `📡네임스페이스: [${nameSpace}]      [${eventType}] socketId: ${socket.id}, role: ${role}, roomId: ${roomId}`
  );

  // 현재 네임스페이스 전체 소켓
  console.log("🔗 현재 접속된 모든 소켓:");
  for (const [id, s] of activitingLocation.sockets) {
    console.log(
      `- ${id} (role: ${s.data?.role || "unknown"}, roomId: ${
        s.data?.roomId || "none"
      })`
    );
  }

  // 현재 방 내 유저
  const room = activitingLocation.adapter.rooms.get(roomId);
  if (room) {
    console.log(`🏠 방 "${roomId}" 안의 유저 목록:`);
    for (const cid of room) {
      console.log(`-- 클라이언트: ${cid}`);
    }
  } else {
    console.log(`❌ 방 "${roomId}"는 비어 있거나 없음`);
  }
  console.log("\n");
};
// 현재 방 내 유저
const logJoin = (socket, fromEvent = "") => {
  const roomId = socket.data?.roomId;
  const role = socket.data?.role || "unknown";

  console.log(
    `🎯 [JOIN] ${socket.id} joined room "${roomId}" (role: ${role}) via ${fromEvent}`
  );

  const room = activitingLocation.adapter.rooms.get(roomId);
  if (room) {
    console.log(`📦 현재 방 "${roomId}"의 유저 목록:`);
    for (const id of room) {
      console.log(`- ${id}`);
    }
  }
  console.log("\n");
};

const hireRequestLog = (toMussemEmail, fromCustomerEmail) => {
  console.log(
    `📨 고용주 ${fromCustomerEmail} 의  📨 머슴 ${toMussemEmail} 으로  요청 수신됨: hireRequest`
  );
  const allSockets = [...activitingLocation.sockets.values()];
  console.log(`👥 현재 activitingLocation 내 소켓 수: ${allSockets.length}`);

  allSockets.forEach((s, i) => {
    console.log(`🔍 소켓 #${i + 1}`);
    console.log(`  - socket.id: ${s.id}`);
    console.log(`  - role: ${s.data?.role}`);
    console.log(`  - 각 연결된 소켓의 객체: ${JSON.stringify(s.data)}`);
  });
  console.log("✅ hireRequestLog 완료 \n");
};

const ReslonseLog = () => {
  console.log("\n");
  console.log(`데이터 로그`);
  const allSockets = [...activitingLocation.sockets.values()];
  console.log(`👥 현재 activitingLocation 내 소켓 수: ${allSockets.length}`);

  allSockets.forEach((s, i) => {
    console.log(`🔍 소켓 #${i + 1}`);
    console.log(`  - socket.id: ${s.id}`);
    console.log(`  - role: ${s.data?.role}`);
    console.log(`  - 각 연결된 소켓의 객체: ${JSON.stringify(s.data)}`);
  });
  console.log("✅ h데이터 로그 완료");
  console.log("\n");
};
// 네임스페이스 생성
const testSocket = io.of("/testSocket");

// 현재 접속 중인 소켓 ID를 저장할 Set
const connectedClients = new Set();

testSocket.on("connection", (socket) => {
  connectedClients.add(socket.id);
  console.clear();
  console.log(`✅ [접속] 클라이언트 접속: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    connectedClients.delete(socket.id);
    console.clear();
    console.log(`❌ [해제] 클라이언트 연결 해제: ${socket.id}`);
    console.log(`🛑 사유: ${reason}`);
  });
});

const connectedactivitingLocation = new Map(); // socket.id → { role }
// 보기 좋은 접속 목록 출력 함수
const printConnectedactivitingLocation = () => {
  console.log("[접속 리스트]");
  for (const [sockId, info] of connectedactivitingLocation.entries()) {
    console.log(`- ${sockId} | role: ${info.role}`);
  }
};
