// api/new-note.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { path, content, message } = req.body;

  if (!path || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const githubRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`, // 在 Vercel 环境变量里配置
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || `Add ${path}`,
        content: Buffer.from(content).toString('base64')
      })
    });

    const data = await githubRes.json();
