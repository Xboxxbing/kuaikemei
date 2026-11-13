/**
 * 极简 multipart/form-data 解析（零依赖，替代 multer）
 * 支持 text 字段与 file 字段，文件写入 public/uploads/
 */
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function parseMultipart(buffer, boundary) {
  const fields = {};
  const files = [];
  const sep = Buffer.from('--' + boundary);
  let pos = buffer.indexOf(sep);
  while (pos >= 0) {
    const start = pos + sep.length + 2; // 跳过 \r\n
    const end = buffer.indexOf(sep, start);
    if (end < 0) break;
    const part = buffer.slice(start, end - 2); // 去掉尾部 \r\n
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd < 0) { pos = end; continue; }
    const headers = part.slice(0, headerEnd).toString('utf8');
    const body = part.slice(headerEnd + 4);
    const nameMatch = /name="([^"]+)"/.exec(headers);
    const fileMatch = /filename="([^"]*)"/.exec(headers);
    const ctMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);
    if (!nameMatch) { pos = end; continue; }
    const name = nameMatch[1];
    if (fileMatch) {
      const filename = fileMatch[1];
      if (filename) {
        files.push({ field: name, filename, mime: ctMatch ? ctMatch[1] : 'application/octet-stream', data: body });
      }
    } else {
      fields[name] = body.toString('utf8');
    }
    pos = end;
  }
  return { fields, files };
}

const ALLOW = /\.(jpe?g|png|gif|webp|svg|pdf|docx?|xlsx?|zip|mp4)$/i;

/** req 为已收集完 body 的 IncomingMessage（Buffer 形式） */
function handleUpload(req, bodyBuffer) {
  ensureDir();
  const ct = req.headers['content-type'] || '';
  const m = /boundary=(?:"([^"]+)"|([^;]+))/.exec(ct);
  if (!m) throw new Error('非 multipart 请求');
  const boundary = m[1] || m[2];
  const { fields, files } = parseMultipart(bodyBuffer, boundary.trim());
  const saved = [];
  for (const f of files) {
    if (!ALLOW.test(f.filename)) continue;
    const ext = path.extname(f.filename).toLowerCase() || '.jpg';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    const rel = '/uploads/' + name;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), f.data);
    saved.push({ field: f.field, filename: f.filename, url: rel, size: f.data.length });
  }
  return { fields, files: saved };
}

module.exports = { handleUpload, UPLOAD_DIR };
