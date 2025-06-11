import { protectedRoutes } from "../config/protectedRoutes.js";
import { match } from "path-to-regexp";
import authObjcet from "../authUtil/authUser/authUser.js";
export const authMiddleware = (req, res, next) => {
  const { url, method, param, body } = req;

  console.log(`url: ${url}  method:${method}`);
  console.log(req.ip)
  console.log(req.session);
  // if 인증을 요구하면 getUserSession을 호출한다.
const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('클라이언트 IP:', ip);
  const prevObj = new authObjcet("ses", "ssss", "ssssss");
  console.log(prevObj);
  prevObj.toString();
  next();
};

const getUserSession = () => {};
