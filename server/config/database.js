// server/config/database.js 수정
const dbConfig = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  connectString: 'localhost:1521/xe', // ✅ 10.0.2.2 → localhost로 변경
};
