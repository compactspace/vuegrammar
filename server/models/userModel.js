import pgPool from "../config/postgres.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { findUser } from "../sql/users/login.js";
import {
  createUser,
  getTermList,
  checkEmailExistsQuery,
  getId,
  createMussem,
  crateRole,
  insertAgreements,
} from "../sql/mussemSignUp/mussemSignUpQuery.js";

import {
  loginInfo,
  mussemActiveArea,
  employInfoForCustomer,
  employInfoForMussem,
} from "../sql/users/login.js";

import { getDefaultChatList } from "../sql/chat/chat.js";

import { redisClient } from "../config/redis.js";

// __dirname 대체 (ESM)
const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);

// 윈도우 경로 보정
if (__dirname.startsWith("/C:")) {
  __dirname = __dirname.substring(1);
}
__dirname = decodeURIComponent(__dirname);

const getClient = async () => await pgPool.connect();

const createUserModel = async (client, { email, hashedPassword }) => {
  const result = await client.query(createUser, [email, hashedPassword]);
  return result.rows[0];
};

const getIdModel = async (client, { email }) => {
  const result = await client.query(getId, [email]);
  return result.rows[0]?.id;
};

const createMussemModel = async (
  client,
  { registeredId, licenseNum, vehicleType, activeRegions }
) => {
  console.log(vehicleType);

  const jsonActiveRegions = JSON.stringify(activeRegions);
  const result = await client.query(createMussem, [
    registeredId,
    licenseNum,
    vehicleType,
    jsonActiveRegions,
  ]);

  await client.query(crateRole, [registeredId, "mussem"]);

  return result.rows[0];
};

const createCustomerModel = async (client, { registeredId }) => {
  const result = await client.query(crateRole, [registeredId, "customer"]);

  return result.rows[0];
};

const agreedTermModel = async (client, { agreedTermIds, registeredId }) => {
  const jsonAgreedTermIds = JSON.stringify(agreedTermIds);
  const result = await client.query(insertAgreements, [
    registeredId,
    jsonAgreedTermIds,
  ]);

  await client.query(crateRole, [registeredId, "mussem"]);

  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const result = await pgPool.query(findUser, [username]);
  return result.rows[0];
};

const loginInfoModel = async (email) => {
  const result = await pgPool.query(loginInfo, [email]);
  return result.rows[0];
};

const getLoginStatusModel = async (idPk) => {
  const data = await redisClient.hGetAll(`loggedIn:${idPk}`);
  return Object.keys(data).length > 0 ? data : null;
};

const socketUserMap = new Map();
const loggedInModel = async (idPk, ip, findKey) => {
  const sessionId = uuidv4(); // UUID 생성 (또는 세션ID)
  const socketId = socketUserMap[idPk] || null; // 등록된 socketId

  await redisClient.hSet(`loggedIn:${findKey}`, {
    ip,
    sessionId,
    loginTime: Date.now(),
    socketId: socketId || "",
  });

  // optional: TTL 설정
  await redisClient.expire(`loggedIn:${idPk}`, 60 * 60); // 1시간
};

const logoutlogModel = async (idPk) => {
  await redisClient.del(`loggedIn:${idPk}`);
};

const mussemActiveAreaModel = async (client, email) => {
  const result = await client.query(mussemActiveArea, [email]);
  return result.rows[0];
};

const getEmployInfoModel = async (client, idPk, role) => {
  let queryEmploymentInfo;
  if (role === "mussem") {
    queryEmploymentInfo = employInfoForMussem;
  } else {
    queryEmploymentInfo = employInfoForCustomer;
  }

  //console.log(`role: ${role}  idPK:${idPk}  `);

  const result = await client.query(queryEmploymentInfo, [idPk]);
  // console.log(result.rows[0]);
  return result.rows[0];
};

const getTermListModel = async (client) => {
  const res = await client.query(getTermList);
  console.log(res);
  return res.rows; // 쿼리 결과 배열만 리턴
};

const getMussemLocations = async (region) => {
  const query = `
    SELECT user_id, license_num, vehicle_type, active_regions, rating, is_available, approved, is_working
    FROM mussem
    WHERE active_regions @> $1
      AND is_available = true
      AND approved = true
      AND is_working = false   -- 쉬고 있는 머슴만 조회
  `;
  const values = [JSON.stringify([region])]; // JSON 배열로 감싸서 넘김
  const result = await pgPool.query(query, values);
  return result.rows;
};

export const checkEmailExistsModel = async (client, email) => {
  const result = await client.query(checkEmailExistsQuery, [email]);
  return result.rows[0].exists; // true or false
};

export const getChatLogModel = async (req, client) => {
  const { employmentId } = req.params;
  const { rows } = await client.query(getDefaultChatList, [employmentId]);

  return rows; // true or false
};

export default {
  getClient,
  createUserModel,
  getIdModel,
  createMussemModel,
  createCustomerModel,
  findUserByUsername,
  getMussemLocations,
  getTermListModel,
  checkEmailExistsModel,
  agreedTermModel,
  loginInfoModel,
  getLoginStatusModel,
  loggedInModel,
  logoutlogModel,
  mussemActiveAreaModel,
  getEmployInfoModel,
  getChatLogModel,
};
