import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import pgPool from "../config/postgres.js";

import { findUser } from "../sql/users/login.js";

const register = async ({ password_hash, email }) => {
  const client = await pgPool.connect();

  const hashedPassword = await bcrypt.hash(password_hash, 10);

  try {
    await client.query("BEGIN");

    const user = await userModel.createUserModel(client, {
      email,
      hashedPassword,
    });

    const registeredId = await userModel.getIdModel(client, {
      email,
    });

    await userModel.createCustomerModel(client, { registeredId });

    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const mussemSignupServcie = async (req) => {
  const {
    email,
    password,
    licenseNum,
    vehicleType,
    activeRegions,
    agreedTermIds,
  } = req.body;
  const client = await userModel.getClient();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await client.query("BEGIN");
    const user = await userModel.createUserModel(client, {
      email,
      hashedPassword,
    });

    console.log(user);

    const registeredId = await userModel.getIdModel(client, {
      email,
    });

    const mussem = await userModel.createMussemModel(client, {
      registeredId,
      licenseNum,
      vehicleType,
      activeRegions,
    });

    // 약관 삽입은 그냥 내비둔다.
    // 디비 설계자체를 바꿔야함 jsonb 타입은
    // join 쓰기가 어렵거나 불가능 하다고함.

    // const agreedTerm = await userModel.agreedTermModel(client, {
    //   agreedTermIds,
    //   registeredId,
    // });

    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const login = async (email, password) => {
  const user = await userModel.findUserByUsername(email);
  if (!user) throw { code: 404, message: "존재하지 않는 사용자입니다." };

  const password_hash = user.password_hash;
  const match = await bcrypt.compare(password, password_hash);
  if (!match) throw { code: 401, message: "비밀번호가 일치하지 않습니다." };

  const loginInfo = await userModel.loginInfoModel(email);

  return {
    id: loginInfo.id,
    email: loginInfo.email,
    role: loginInfo.role,
  };
};

const getLoginStatusService = async (idPk) => {
  return await userModel.getLoginStatusModel(idPk);
};

const loggedInService = async (idPk, ip, findKey) => {
  await userModel.loggedInModel(idPk, ip, findKey);
};

const logoutlogService = async (idPk) => {
  return await userModel.logoutlogModel(idPk);
};

const getMussemActiveArea = async (email) => {
  const client = await pgPool.connect();

  const mussemActiveArea = await userModel.mussemActiveAreaModel(client, email);

  return mussemActiveArea;
};

const getEmployInfo = async (idPk, role) => {
  const client = await pgPool.connect();

  const mussemActiveArea = await userModel.getEmployInfoModel(
    client,
    idPk,
    role
  );

  return mussemActiveArea;
};

const checkEmailExistsService = async (email) => {
  let isExists = false;
  const client = await pgPool.connect();
  try {
    isExists = await userModel.checkEmailExistsModel(client, email);
  } catch (err) {
    console.error("getTermList error:", err);
    throw err;
  } finally {
    client.release();

    return isExists;
  }
};

const getTermListService = async () => {
  const client = await pgPool.connect();

  try {
    const terms = await userModel.getTermListModel(client);
    return terms;
  } catch (err) {
    console.error("getTermList error:", err);
    throw err;
  } finally {
    client.release();
  }
};

const findByRegion = async (region) => {
  return await userModel.getMussemLocations(region);
};

const getChatLogService = async (req, res) => {
  let client;
  try {
    client = await pgPool.connect();
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
    console.log(await userModel.getChatLogModel(req, client))
    return await userModel.getChatLogModel(req, client);
  }
};

export default {
  register,
  login,
  getLoginStatusService,
  loggedInService,
  logoutlogService,
  findByRegion,
  getTermListService,
  checkEmailExistsService,
  mussemSignupServcie,
  getMussemActiveArea,
  getEmployInfo,
  getChatLogService,
};
