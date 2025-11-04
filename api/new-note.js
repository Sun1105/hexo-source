// api/new-note.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${title.replace(/\s+/g, '-')}.md`;

  const frontMatter = `---
title: ${title}
date: ${date}
tags: ${tags || []}
---

${content}
`;

  const url = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/source/_posts/${filename}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add new note: ${title}`,
      content: Buffer.from(frontMatter).toString('base64'),
      branch: process.env.GITHUB_BRANCH,
    }),
  });

  const data = await response.json();
  if (response.ok) {
    res.status(200).json({ message: 'Note created successfully', data });
  } else {
    res.status(500).json({ error: data });
  }
}
