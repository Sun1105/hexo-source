export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许 POST 请求' });
  }

  try {
    const { filename, content, type, category } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: '缺少文件名或内容' });
    }

    const owner = 'Sun1105';
    const repo = 'hexo-source';
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({ error: '服务器未配置 GitHub Token' });
    }

    const safeCategory = category && /^[a-z0-9_-]+$/i.test(category) ? category : 'default';
    const path = `source/study/${safeCategory}/${filename}`;

    // 1. 尝试获取现有文件的 sha（如果文件已存在）
    let sha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'Vercel-Serverless-Function'
        }
      });
      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }
    } catch (e) {
      // 忽略错误，可能文件不存在
    }

    // 2. 上传或更新文件
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Serverless-Function'
      },
      body: JSON.stringify({
        message: `${sha ? '更新' : '上传'}学习资料 ${filename}`,
        content,
        sha // 如果是更新文件，必须提供 sha
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        url: data.content && data.content.html_url
      });
    }

    return res.status(400).json({ error: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
