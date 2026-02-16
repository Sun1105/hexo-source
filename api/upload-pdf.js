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

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `上传学习资料 ${filename}`,
        content
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
