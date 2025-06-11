export const checkSessionStatus = (req, res, next) => {
  const sid = req.cookies["connect.sid"];
  const user = req.session?.user;
  console.log(user);
  // 주의 해야 할사항 req.authStatus 는 우리가 만든속성 임. authMiddleware에서 사용할것임
  if (!sid) {
    req.authStatus = "no-cookie"; // 쿠키조차 없음
  } else if (!user) {
    req.authStatus = "no-user"; // 세션 있음, 로그인은 안 함
  } else {
    req.authStatus = "valid"; // 로그인 되어 있음
  }

  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const email = user?.email || "게스트";
  const roles = user?.role || "없음";

  console.log(`⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇`);
  console.log(`📍[세션 상태 확인] ${timestamp}`);
  console.log(`  📡 IP         : ${ip}`);
  console.log(`  🍪 쿠키 존재   : ${sid ? "✅ 있음" : "⛔ 없음"}`);
  console.log(`  👤 사용자      : ${email}`);
  console.log(`  🛡️ 권한         : ${roles}`);
  console.log(`  🔐 상태         : ${req.authStatus}`);
  console.log(`⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆\n`);

  next();
};
