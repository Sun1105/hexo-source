const ALLOWED_CATEGORIES = ['bcs', 'bcx', 'bzs', 'bzx', 'bgs', 'bgx'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允许 GET 请求' });
  }

  try {
    const { category } = req.query || {};

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: '无效的分类' });
    }

    const owner = 'Sun1105';
    const repo = 'hexo-source';
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({ error: '服务器未配置 GitHub Token' });
    }

    const path = `source/study/${category}`;

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text || '获取文件列表失败' });
    }

    const data = await response.json();
    const files = Array.isArray(data)
      ? data
          .filter(item => item.name && /\.(pdf|png|jpe?g|gif|webp|svg)$/i.test(item.name))
          .map(item => ({
            name: item.name,
            path: item.path,
            download_url: item.download_url || '',
            html_url: item.html_url || ''
          }))
      : [];

    return res.status(200).json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

