const customerSubPath = ["/employment"];

const mussemSubPath = ["/employment"];
export const protectedRoutes = [
  { basePath: "/users", method: ["GET", "POST"], roles: ["admin"] },

  {
    basePath: "/customer",
    subPath: customerSubPath,
    method: ["GET", "POST"],
    roles: ["customer"],
  },
  {
    basePath: "/mussem",
    subPath: mussemSubPath,
    method: ["GET", "POST"],
    roles: ["mussem"],
  },
];
