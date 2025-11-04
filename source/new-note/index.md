---
title: 新建笔记
layout: page
---

<form id="newNoteForm">
  <label>标题：<input type="text" name="title" required></label><br>
  <label>标签：<input type="text" name="tags"></label><br>
  <label>内容：</label><br>
  <textarea name="content" rows="10" cols="50" required></textarea><br>
  <button type="submit">提交</button>
</form>

<script>
document.getElementById('newNoteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    title: form.title.value,
    tags: form.tags.value.split(',').map(t => t.trim()),
    content: form.content.value
  };

  const res = await fetch('/api/new-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    alert('笔记创建成功！请等待 Vercel 自动部署完成。');
    window.location.href = '/';
  } else {
    alert('创建失败：' + JSON.stringify(data.error));
  }
});
</script>
