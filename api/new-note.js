/**
 * 新建文章 API
 * 前端传入：
 *  {
 *    path: 文件路径，例如 _posts/1699170000000-标题.md
 *    content: Markdown 内容
 *    message: Git 提交信息
 *  }
 * 后端使用 GitHub Token 写入仓库
 */
export default async function handler(req, res) {
  if(req.method !== 'POST'){
    return res.status(405).json({ error: '只允许 POST 请求' });
  }

  try {
    const { path, content, message } = req.body;

    // GitHub 仓库信息
    const owner = process.env.GITHUB_OWNER;    // 替换成你的 GitHub 用户名
    const repo = process.env.GITHUB_REPO;          // 替换成你的仓库名
    const token = process.env.GITHUB_TOKEN;      // 在 Vercel 环境变量中设置

    // Markdown 内容必须 Base64 编码
    const base64Content = Buffer.from(content).toString('base64');

    // 调用 GitHub API 创建新文件
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || `新建文章`,
        content: base64Content,
      }),
    });

    const data = await response.json();

    if(response.ok){
      res.status(200).json({ success: true, url: data.content.html_url });
    } else {
      res.status(400).json({ error: data });
    }

  } catch(err){
    res.status(500).json({ error: err.message });
  }
}
