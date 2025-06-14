import userService from "../services/userService.js";
import { authUser } from "../authUtil/authLogin/authLogin.js";
import { redisPublisher } from "../config/redis.js";
import { redisSubscriber } from "../config/redis.js";
export const registerUser = async (req, res) => {
  try {
    const user = await userService.register(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "이미 존재하는 사용자 이름입니다." });
    }
    console.error("회원가입 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "회원가입 실패. 서버 오류." });
  }
};

export const mussemSignup = async (req, res) => {
  try {
    const user = await userService.mussemSignupServcie(req);
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.log(error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "이미 존재하는 사용자 이름입니다." });
    }
    console.error("회원가입 오류:", error);
    res
      .status(500)
      .json({ success: false, message: "회원가입 실패. 서버 오류." });
  }
};

export const loginUser = async (req, res) => {
  //const ip = req.ip + 1;
  const ip = req.ip;
  const { email, password } = req.body;

  try {
    // 1. 사용자 인증
    const userInfo = await userService.login(email, password);
    if (!userInfo) return res.status(401).json({ message: "로그인 실패" });

    const idPk = userInfo.id;

    // 2. 기존 로그인 정보 조회 (IP 비교)
    const existingLogin = await userService.getLoginStatusService(idPk);
    console.log(`existingLogin: ${existingLogin?.ip}`);

    // 여기 조건은 필요 시 실제 비교로 바꿔주세요
    if (existingLogin && existingLogin.ip && existingLogin.ip !== ip) {
      // 3. Redis에 로그인 승인 요청 발행
      await redisPublisher.publish(
        "loginApprovalRequest",
        JSON.stringify({ userId: idPk, ip })
      );

      // 4. Redis에서 승인 응답 기다리기 (15초 타임아웃)
      let approvalResult;
      try {
        approvalResult = await new Promise(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("기기 응답 시간 초과"));
          }, 15000);

          const handleMessage = async (message) => {
            try {
              const { userId, approved } = JSON.parse(message);
              if (userId === idPk) {
                clearTimeout(timeout);
                await redisSubscriber.unsubscribe("loginApprovalResponse");
                resolve(approved);
              }
            } catch (e) {
              console.error("❌ 메시지 처리 오류:", e);
            }
          };

          await redisSubscriber.subscribe(
            "loginApprovalResponse",
            handleMessage
          );
        });
      } catch (err) {
        if (!res.headersSent) {
          return res
            .status(408)
            .json({ message: err.message || "응답 시간 초과" });
        }
        throw err;
      }

      // 5. 응답 결과 처리
      if (approvalResult !== true) {
        return res.status(403).json({ message: "로그인 거절됨" });
      }

      // 승인되면 IP 업데이트
      await userService.loggedInService(idPk, ip);
    } else {
      // 기존 IP와 같거나 최초 로그인
      await userService.loggedInService(idPk, ip);
    }

    // 6. 최종 로그인 성공 응답
    res.json({
      loginSuccess: true,
      message: "로그인 성공",
      userDetail: {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
      },
    });
  } catch (err) {
    console.error("❌ 로그인 처리 중 오류:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "서버 오류" });
    }
  }
};

export const logout = (req, res) => {
  console.log("로그 아웃 유저 세션 ID:", req.sessionID);
  // console.log("쿠키 상태:", req.cookies);
  // 세션 종료 후 connect.sid 쿠키 삭제
  res.clearCookie("connect.sid", {
    path: "/", // 쿠키의 경로를 명시적으로 설정 (기본값 '/'로 설정)
    httpOnly: true, // 쿠키가 HTTP로만 접근 가능하도록 설정
    secure: process.env.NODE_ENV === "production", // HTTPS 환경에서만 secure 쿠키
    sameSite: "strict", // SameSite 설정
  });

  req.session.destroy(() => {
    res.clearCookie("connect.sid"); // 기본 세션 쿠키명
    res.json({ success: true, message: "로그아웃 성공" });
  });
};

export const authcheck = async (req, res) => {
  const { username } = req.session.user;
  if (username) {
    // 로그인된 상태
    console.log(`username:  ${username}`);
    await res.json({ loggedIn: true, userInfo: req.session });
  } else {
    // 로그인되지 않은 상태
    res.json({ loggedIn: false });
  }
};

export const getTermList = async (req, res) => {
  console.log(req);
  try {
    const termList = await userService.getTermListService();
    if (termList && termList.length > 0) {
      return res.status(200).json({ success: true, termList });
    }
    return res
      .status(404)
      .json({ success: false, message: "약관 데이터가 없습니다." });
  } catch (err) {
    console.error("getTermList controller error:", err);
    return res.status(500).json({ success: false, message: "약관 조회 실패" });
  }
};

export const checkEmailExistsController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "이메일을 입력해주세요." });
    }
    const exists = await userService.checkEmailExistsService(email);
    res.json({ success: true, exists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};
export const getMussemLocations = async (req, res) => {
  const region = req.query.region;
  if (!region)
    return res
      .status(400)
      .json({ success: false, message: "region 쿼리 필요" });

  try {
    const mussems = await userService.findByRegion(region);
    res.json({ success: true, mussems });
  } catch (error) {
    console.error("머슴 조회 에러:", error);
    res.status(500).json({ success: false, message: "머슴 조회 실패" });
  }
};

export const getChatLog = async (req, res) => {
  console.log("????????????????????????????????????????????")
  const chatRows = await userService.getChatLogService(req, res);
  res.json(chatRows);
};
