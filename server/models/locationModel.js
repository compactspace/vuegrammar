// server/models/locationModel.js
import pool from "../config/db.js"; // DB 연결 풀 가져오기

// 위치 데이터 삽입
async function addLocation(user_id, lat, lon, address) {
  const conn = await pool.getConnection(); // DB 연결 가져오기
  try {
    const result = await conn.query(
      "INSERT INTO locations (user_id, lat, lon, address) VALUES (?, ?, ?, ?)",
      [user_id, lat, lon, address] // 파라미터를 쿼리에 바인딩
    );
    return result;
  } catch (error) {
    throw error; // 오류 발생 시 throw
  } finally {
    conn.release(); // DB 연결 반환
  }
}
// 위치 데이터 조회
async function getLocation(user_id) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT * FROM locations WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1",
      [user_id] // user_id에 맞는 마지막 위치를 가져옴
    );
    return rows;
  } catch (error) {
    throw error;
  } finally {
    conn.release();
  }
}

export { addLocation, getLocation }; // 함수 내보내기
