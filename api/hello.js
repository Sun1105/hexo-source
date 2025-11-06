// 一个极简的测试函数，用来确认 Vercel 是否正确暴露 /api 路由
export default async function handler(req, res) {
  const data = { time: new Date().toISOString() };
  res.status(200).json(data);
}
