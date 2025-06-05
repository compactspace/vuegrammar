// server/config/db.js
import mariadb from 'mysql2/promise';  // ES Modules 방식으로 import

// MariaDB 연결 풀 설정
const pool = mariadb.createPool({
    host:'localhost',
    port:'3306',
    user:'root',
    password:'1111',
    database: 'musseum_db', 
    timezone : "Asia/Seoul",
    connectionLimit: 500
});

export default pool;  // ES Modules 방식으로 export
