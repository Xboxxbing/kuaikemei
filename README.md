# 快可美 quick-mix 官网（前台 + 后台）

> **看不懂就看这个：** 浏览器直接打开 **`deploy-guide.html`**，里面有 macOS / Windows / 云服务器的详细图文步骤。
> 本文件是纯文本版总览。

---

## 最快上手（3 步）

1. 装 Node.js → https://nodejs.org 下载左边 **LTS** 版本，双击安装
2. 解压 `quickmix-site.zip`（放在桌面、下载文件夹都行）
3. 打开终端，**粘贴一行命令**（推荐，不会被 macOS 安全警告拦截）：

```bash
node ~/Desktop/quickmix-site/server/app.js
```

> **文件不在桌面？** 把 `~/Desktop` 换成实际位置，比如 `~/Downloads`。
> **文件夹名不确定？** 用拖拽法（下面），连名字都不用管。

| 入口 | 地址 |
|---|---|
| 前台首页 | http://localhost:3000/ |
| 管理后台 | http://localhost:3000/admin |
| 后台账号 | admin / admin |

**窗口不能关，关了网站就停。停止服务按 `Ctrl + C`。** 端口被占用会自动顺延，以终端实际输出的地址为准。

### 文件放在桌面 / 终端一直不成功？

早期教程里的命令写的是 `cd ~/Downloads/quickmix-site && node server/app.js`——那是「下载」文件夹的路径。文件在**桌面**时 `cd` 第一步就失败，`&&` 后面根本没执行。**不是操作错，是路径给错了。**

这个服务按自身位置找文件，**不需要 `cd`、也不需要 `&&`**。最稳的是「拖拽法」，连文件夹叫什么、放哪儿都不用管：

1. `Command + 空格` → 输入「终端」→ 回车
2. 终端里敲 `node ` —— **node 后面有一个空格，别漏**，先别回车
3. Finder 打开 `桌面 → quickmix-site → server`，把 **app.js** 拖进终端窗口，路径会自动填出来
4. 回车 → 看到「前台首页：http://localhost:3000/」即成功

不想拖也可以用这两条（桌面专用，粘进终端回车）：

```bash
# 文件夹名就是 quickmix-site
node ~/Desktop/quickmix-site/server/app.js

# 文件夹名带 (1)、带空格或套了一层？自动找
node "$(find ~/Desktop -path '*/server/app.js' | head -1)"
```

常见报错：

| 终端显示 | 怎么办 |
|---|---|
| `cd: no such file or directory` | 别用带 `cd ~/Downloads` 的老命令，用上面的桌面命令或拖拽法 |
| `node: command not found` | 没装 Node，去 nodejs.org 装 LTS，**装完把终端关掉重开** |
| `Error: Cannot find module` | 拖错文件了，要拖 `server` 里的 `app.js` |
| `syntax error` / 乱码 | 复制带了中文符号或漏空格，手动敲一遍 |
| 地址变成 3001 | 正常，以终端打印的地址为准 |

### ⚠ macOS 弹「Apple 无法验证 start-mac.command」

这是 macOS 对**网上下载的未签名脚本**的例行检查，**不是文件损坏、也不是脚本有问题**（脚本只做：检查 Node → 换端口 → 启动服务 → 开浏览器，无联网下载、无 sudo、不改系统文件）。

**为什么上个版本没事、这个版本又弹**：macOS 的放行只认「具体那一个文件」。每次重新下载 / 重新解压，`start-mac.command` 都是新文件、被重新打上隔离标记，需要再放行一次；旧文件当时已放行过，新文件没有。

三种解法（任选其一）：

```bash
# A. 最省事（100% 有效）：根本不碰脚本，直接用终端启动
node ~/Desktop/quickmix-site/server/app.js

# B. 永久解决（100% 有效）：清掉整包隔离标记，之后随便双击
cd ~/Desktop/quickmix-site && xattr -dr com.apple.quarantine . && chmod +x start-mac.command
# 还没解压的话，也可以先对 zip 清：xattr -d com.apple.quarantine ~/Desktop/quickmix-site.zip

# C. 不想开终端：右键 start-mac.command → 打开 → 弹窗点「打开」
#    或 系统设置 → 隐私与安全性 → 「仍要打开」
#    注意：较新的 macOS 对未签名脚本可能只给「完成 / 移到废纸篓」，没有「打开」，
#          这种情况直接用 A 或 B。
```

同目录有纯文本 **`macOS首次启动必读.txt`**，双击用文本编辑打开，不会触发任何警告；`deploy-guide.html` 顶部也有「桌面专区」和报错对照表。已点「移到废纸篓」也没关系，重新解压 zip 即可。

---

## 目录结构

```
quickmix-site/
├── start-mac.command      macOS 双击启动
├── start-windows.bat          Windows 双击启动
├── deploy-guide.html         详细部署教程（浏览器打开）
├── server/               后端（Node 内置模块，零依赖）
│   ├── app.js            HTTP 服务 + 全部 API
│   ├── db.js             JSON 持久化存储
│   ├── upload.js         图片上传
│   └── data/
│       ├── seed.json     初始内容
│       └── db.json       运行后生成，日常数据在这
├── public/               前台静态站（14 个页面）
│   ├── index.html  about.html  sievert.html  home-field.html
│   ├── building.html  products.html  product.html
│   ├── cases.html  case.html  news.html  news-detail.html
│   ├── service.html  dealers.html  contact.html
│   ├── assets/  data/site.js  uploads/
├── admin/                后台管理系统（原生 JS，无需构建）
├── tools/
│   ├── gen-images.js     批量生成矢量占位素材
│   └── gen-fallback.js   后台内容 → 前台静态快照
```

---

## v2 视觉精修（本轮更新）

| 项目 | 说明 |
|---|---|
| 首屏 | 三屏轮播改为「左侧深色文字区 + 右侧整幅实拍大图」，带缓慢推镜；文字始终在纯深色背景上，任何图片下都清晰 |
| 真实配图 | 案例 6 张、新闻封面全部换成真实工程/产品摄影；首页三屏分别用家装空间、产品特写、工程建筑 |
| 产品图 | 22 张统一橙色「展陈式」产品卡（按品类配色），列表整齐；实拍海报保留在详情页图集里切换查看 |
| 内页头图 | 面包屑区升级为品牌 banner（渐变底纹 + 大号英文水印），消除导航到标题之间的空洞 |
| 内容恒可见 | 入场动画改为「默认可见 + 播放动画」，即使 JS 未执行 / 观察器未触发 / 打印截图，也不会出现整片空白 |
| 陈列修正 | 产品图改为完整展示（`object-fit: contain`），竖版海报不再被裁掉文字；案例遮罩加深保证白字可读 |
| 移动端 | 筛选按钮单行横向滑动、搜索独占整行；产品网格 2 列；省份地图在容器内横向滑动；14 个页面均无横向溢出 |
| 交互修正 | 关键词搜索跨全部品类；CSS 背景图路径修正（原先 5 处 404） |

生成/刷新产品卡：`python3 tools/gen-product-cards.py`（改了产品名或型号后重跑即可）。

## 动态效果与交互控件（全站通用）

`public/assets/js/motion.js` 一次接入，14 个页面全部生效：

| 类别 | 效果 |
|---|---|
| 滚动入场 | 卡片、案例、新闻、方案、数据、时间轴等进入视口时依次淡入上移（同组错开 70ms） |
| 数字滚动 | 1919 / 60+ / 30+ 等指标滚动到目标值 |
| Hero 轮播 | 首页 3 屏自动轮播（6s），文字逐层入场，左右箭头 + 进度式指示点 + 触摸滑动，鼠标悬停暂停 |
| 顶部进度条 | 页面滚动进度实时显示 |
| 导航动效 | 滚动后导航收缩并加阴影 |
| 悬浮控件 | 右下角「在线咨询」面板（热线/商务电话/服务时间/入口）+ 返回顶部 |
| 图片灯箱 | 点击产品图、案例图、文章配图放大，支持 ← → 切换、Esc 关闭 |
| 卡片光晕 | 鼠标在卡片上移动时跟随的红色柔光 |
| 按钮流光 | 主按钮 hover 时的高光扫过 |
| 产品对比 | 产品中心勾选最多 4 款 → 底部对比栏 → 弹出参数对比表 |
| 其他 | CTA 渐变流动、锚点平滑滚动、图片懒加载、页面淡入、骨架屏 |

已适配 `prefers-reduced-motion`（系统开启减弱动效时自动关闭动画）与移动端。

## 产品图片

- 原站 `quick-mix.com.cn` 的图片服务器开启了全站策略拦截（直连返回 403），无法直接抓取。
- 已通过公开渠道获取到 **9 张快可美真实产品/场景图**，接入 BIOBASIERT、NANO 纳米矿岩、RETEXTUR 纹理、Q70 聚脲四款主力产品（含多图图集）。
- 其余产品仍为自动生成的矢量占位图，拿到实拍图后在后台「产品中心 → 产品主图」上传即可覆盖。
- **版权提醒**：这些图片来自公开传播渠道，正式商用前请确认授权；建议逐步替换为自己的实拍图。

## 后台打不开 / 菜单点了没反应

本版已修复，若你手上还是旧包，按下面顺序处理：

| 现象 | 原因 | 处理 |
|---|---|---|
| 左侧菜单点了内容区不变，一直停在仪表盘 | 旧版只在「已有登录态」时注册路由监听，首次登录后点菜单只改地址不刷新内容 | 更新到本版；临时解法：登录后按一次 F5 刷新即可恢复 |
| 打开后台一直显示「加载中…」 | 访问的是不带尾部斜杠的 `/admin`，相对资源路径被解析到站点根目录而 404 | 访问 `/admin/`（带斜杠）；本版已自动把 `/admin` 跳到 `/admin/` |
| 内容区一片空白、没报错 | 页面渲染异常被静默吞掉 | 本版会显示「页面加载失败 + 重新加载」按钮 |
| 改完还看到旧界面 | 浏览器缓存了旧的后台 JS/CSS | 强刷：Mac `Cmd+Shift+R`，Windows `Ctrl+Shift+R`；本版资源已加版本号 |

**验证方式**：登录后依次点「产品中心 / 解决方案 / 案例工程 / 新闻资讯 / 合作运营商 / 线索与表单 / 站点设置 / 仪表盘」，标题和内容区应逐一切换。

## 后台能做什么

| 模块 | 功能 |
|---|---|
| 仪表盘 | 产品/案例/资讯/运营商/线索数量、今日线索、状态分布 |
| 产品中心 | 增删改查；特点（多行）、技术参数（键值表）、施工工艺、主图上传、**色卡取色**、上下架、排序 |
| 解决方案 | 家装/建筑方案，核心优势标签、介绍、配图、排序 |
| 案例工程 | 标题、分类、地点、规模、年份、建设单位、封面、图集、应用系统、正文 |
| 新闻资讯 | 标题、分类、日期、来源、封面、摘要、正文、置顶、显示状态 |
| 合作运营商 | 门店、类型、省市、地址、联系人、电话、经纬度 |
| 线索与表单 | 询价/加盟/施工队/工程采买汇总，改状态、写备注、**导出 CSV** |
| 站点设置 | 公司名、标语、热线、地址、备案号、简介、首页数据指标、发展历程 |
| 修改密码 | 右上角「修改密码」 |

后台保存后前台刷新即生效，无需重启。

---

## 部署到公网（摘要，详见 deploy-guide.html）

1. 买**腾讯云 / 阿里云轻量应用服务器**，2核2G，Ubuntu 22.04，防火墙放行 22/80/443
2. Mac 终端：`ssh root@公网IP`
3. 装 Node：`curl -fsSL https://deb.nodesource.com/setup_20.x | bash -` 然后 `apt install -y nodejs`
4. 传文件：`scp quickmix-site.zip root@公网IP:/root/` → 服务器上 `unzip`
5. 常驻：`npm i -g pm2` → `pm2 start server/app.js --name quickmix` → `pm2 save && pm2 startup`
6. nginx 反代 80 → 3000，域名解析 A 记录到公网 IP
7. HTTPS：`certbot --nginx -d www.你的域名.com`
8. **国内服务器需 ICP 备案**

临时演示不想买服务器：本机跑起来后装 cpolar，`cpolar http 3000` 拿到公网地址。

---

## Windows 特别注意

- 双击 **`start-windows.bat`**（不是 .command）
- 文件夹放在**无中文、无空格**的路径，如 `D:\quickmix-site`
- 用 7-Zip / WinRAR 解压；编辑源码用 VS Code（UTF-8），别用系统记事本
- 防火墙弹窗选「允许访问」

---

## 备份与运维

- **所有内容在 `server/data/db.json`**，备份这一个文件即可（另加 `public/uploads/`）
- 恢复出厂数据：删掉 `db.json` 重启
- 后台改完想让双击 html 也显示新内容：`node tools/gen-fallback.js`
- 换 MySQL/SQLite：只替换 `server/db.js`，保持 `all/find/query/insert/update/remove/getSettings/saveSettings` 签名不变

---

## 内容说明

**真实资料已填**：BIOBASIERT 生物基、NANO 纳米矿岩、RETEXTUR 纹理、H30 氢化、Q10/Q30/Q50/Q70/Q80 全系美缝的规格/执行标准/施工工艺；安徽公安学院（鲁班奖）、太仓被动房案例；2026 三擎发布会等新闻；西伟德 1919 / 60+ 机构 / 30+ 工厂。

**需你替换**：4 条标注「示例数据」的案例、22 个运营商网点的电话地址、生成的矢量占位产品图、备案号与联系方式。

**版权提示**：安徽公安学院、鲁班奖、安徽建博会 3 张配图来自公开传播渠道，正式商用前请确认授权或换成自拍图。

---

**上线前必做**：后台右上角改掉默认密码 admin/admin。
