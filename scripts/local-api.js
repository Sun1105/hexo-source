const fs = require('fs');
const path = require('path');

/**
 * Hexo 本地 API 模拟插件
 * 当在本地运行 hexo server 时，拦截 /api/* 请求，直接操作本地文件系统
 */
hexo.extend.filter.register('server_middleware', function(app) {
    // 1. 中间件：解析 JSON 请求体
    app.use('/api', (req, res, next) => {
        if (req.method === 'POST') {
            let data = '';
            req.on('data', chunk => { data += chunk; });
            req.on('end', () => {
                try {
                    if (data) {
                        req.body = JSON.parse(data);
                    }
                    next();
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    next();
                }
            });
        } else {
            next();
        }
    });

    // 2. 路由：GET /api/get-content?path=...
    // 模拟 GitHub Get Contents API，用于本地编辑时读取原始内容
    app.use('/api/get-content', (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let filePath = url.searchParams.get('path');
        
        if (!filePath) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing path parameter' }));
        }

        // 解码路径并确保是相对路径
        filePath = decodeURIComponent(filePath);
        const fullPath = path.join(hexo.base_dir, filePath);

        if (fs.existsSync(fullPath)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                res.setHeader('Content-Type', 'application/json');
                // 返回格式尽量模拟 GitHub API，方便前端处理
                res.end(JSON.stringify({
                    content: Buffer.from(content).toString('base64'),
                    encoding: 'base64',
                    path: filePath,
                    sha: 'local-file-sha-' + Date.now() 
                }));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
            }
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'File not found: ' + filePath }));
        }
    });

    // 3. 路由：POST /api/edit-note 和 /api/new-note
    // 统一处理保存逻辑
    const handleSave = (req, res) => {
        if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end();
        }

        const { path: filePath, content } = req.body || {};
        
        if (!filePath || content === undefined) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing path or content' }));
        }

        const fullPath = path.join(hexo.base_dir, filePath);
        
        try {
            // 确保父目录存在
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`[Local API] Saved: ${filePath}`);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Local save successful' }));
        } catch (e) {
            console.error('[Local API] Save Error:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
        }
    };

    app.use('/api/edit-note', handleSave);
    app.use('/api/new-note', handleSave);

    // 4. 路由：GET /api/list-posts?path=...
    // 模拟 GitHub List Contents API
    app.use('/api/list-posts', (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        let dirPath = url.searchParams.get('path') || 'source/_posts';
        
        dirPath = decodeURIComponent(dirPath);
        const fullDir = path.join(hexo.base_dir, dirPath);

        if (fs.existsSync(fullDir)) {
            try {
                const files = fs.readdirSync(fullDir);
                const data = files.map(file => {
                    const filePath = path.join(fullDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: path.join(dirPath, file).replace(/\\/g, '/'),
                        size: stats.size,
                        type: stats.isDirectory() ? 'dir' : 'file',
                        sha: 'local-' + stats.mtimeMs // 模拟 SHA，本地使用修改时间戳
                    };
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
            }
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Directory not found: ' + dirPath }));
        }
    });
});
