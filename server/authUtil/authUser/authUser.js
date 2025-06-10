class authObjcet {
  userId;
  Role;
  userIP;
  constructor(userId, Role, userIP) {
    this.userId = userId;
    this.Role = Role;
    this.userIP = userIP;
  }

  toString() {
    console.log(`⬇️⬇️⬇️🌐 [현재 인증객체 요약] ⬇️⬇️⬇️`);
    console.log(this.userId, this.Role, this.userIP);
    console.log(`⬆️⬆️⬆️🌐 [현재 인증객체 요약 끝] ⬆️⬆️⬆️  \n`);
  }
}

export default authObjcet;
