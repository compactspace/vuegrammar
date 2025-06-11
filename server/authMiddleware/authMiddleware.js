import { match } from "path-to-regexp";

// 📘 접근 제어 규칙 정의
const accessControlList = [
  { path: "/customer", requiredRole: "customer", methods: ["GET", "POST"] },
  {
    path: "/customer/:subpath*",
    requiredRole: "customer",
    methods: ["GET", "POST"],
  },
  { path: "/mussem", requiredRole: "mussem", methods: ["GET", "POST"] },
  {
    path: "/mussem/:subpath*",
    requiredRole: "mussem",
    methods: ["GET", "POST"],
  },
  { path: "/users", requiredRole: false, methods: ["GET", "POST"] },
  {
    path: "/auth/status",
    requiredRole: ["mussem", "customer"],
    methods: ["GET", "POST"],
  },
];

// 📌 path-to-regexp matcher 미리 생성
const routeMatchers = accessControlList.map((route) => ({
  ...route,
  matcher: match(route.path, {
    decode: decodeURIComponent,
    end: false,
    strict: false,
  }),
}));

// 📘 액세스 로깅 유틸
const logAccess = ({ user, path, method, allowed, reason }) => {
  const email = user?.email || "게스트";
  const roles = user?.role || "없음";
  const status = allowed ? "✅ 통과" : "⛔ 차단";
  const timestamp = new Date().toISOString();

  console.log(`⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇`);
  console.log(`[${timestamp}] ${status}`);
  console.log(`요청: ${method} ${path}`);
  console.log(`유저: ${email} (roles: ${roles})`);
  if (reason) console.log(`🛑 이유: ${reason}`);
  console.log(`⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆\n`);
};

// 🛡️ 인증 + 인가 미들웨어
export const authMiddleware = (req, res, next) => {
  const { path, method } = req;
  const user = req.session?.user;

  // 1. /users 경로는 인증 없이 누구나 접근 가능
  if (path.startsWith("/users")) {
    logAccess({ user, path, method, allowed: true });
    return next();
  }

  if (path === "/auth/status") {
    logAccess({ user, path, method, allowed: true });
    return next(); // 무조건 통과시켜서 라우터에서 처리
  }

  for (const route of routeMatchers) {
    const matched = route.matcher(path);
    if (matched) {
      // 1. 메서드 허용 여부
      if (route.methods && !route.methods.includes(method)) {
        logAccess({
          user,
          path,
          method,
          allowed: false,
          reason: `허용되지 않은 메서드 (${method})`,
        });
        return res.status(405).json({
          error: `허용되지 않은 메서드입니다. (${route.methods.join(", ")})`,
        });
      }

      // 2. 권한이 필요한지 확인

      if (route.requiredRole) {
        logAccess({ user, path, method, allowed: true });
        return next(); // 공개 경로
      }

      // 3. 세션 상태 체크 (checkSessionStatus 미들웨어 전제)
      if (req.authStatus !== "valid") {
        logAccess({
          user,
          path,
          method,
          allowed: false,
          reason: `세션 없음 또는 만료됨 (authStatus: ${req.authStatus})`,
        });
        return res.status(401).json({ error: "로그인이 필요합니다." });
      }

      // 4. 역할 검사
      if (route.requiredRole.includes(user?.role)) {
        logAccess({ user, path, method, allowed: true });
        return next();
      } else {
        logAccess({
          user,
          path,
          method,
          allowed: false,
          reason: `필요한 권한: ${route.requiredRole}`,
        });
        return res.status(403).json({ error: "접근 권한이 없습니다." });
      }
    }
  }

  // ❌ 매칭되는 경로 없음
  logAccess({
    user,
    path,
    method,
    allowed: false,
    reason: "등록되지 않은 보호 경로",
  });
  return res.status(404).json({ error: "존재하지 않는 경로입니다." });
};
