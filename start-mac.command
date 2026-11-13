#!/bin/bash
# ============================================================
#  快可美官网 · 一键启动（macOS / Linux 通用）
#  用法：双击本文件即可；或在终端里执行 ./启动网站.command
# ============================================================

# 切到脚本所在目录（双击运行时工作目录可能是家目录）
cd "$(dirname "$0")" || exit 1

clear
echo ""
echo "================================================"
echo "  快可美 quick-mix 官网 · 启动程序"
echo "================================================"
echo ""

# 1. 检查 Node 是否安装
if ! command -v node >/dev/null 2>&1; then
  echo "  [×] 没有检测到 Node.js"
  echo ""
  echo "  请先安装 Node.js（只要装一次，几十秒搞定）："
  echo ""
  echo "  方式一（推荐）：打开 https://nodejs.org ，下载左边的 LTS 版本"
  echo "                  一路下一步安装完，再回来双击本文件。"
  echo ""
  echo "  方式二（装了 Homebrew）：在终端执行 brew install node"
  echo ""
  echo "  装完后，把这个窗口关掉，重新双击本文件即可。"
  echo ""
  read -r -p "  按回车键关闭…" _
  exit 1
fi

echo "  [√] Node.js 已安装：$(node -v)"
echo ""

# 2. 端口设置（默认 3000，想改就改这里的数字）
PORT_NUM=3000

# 3. 判断端口是否已被占用，占用就自动换一个
while lsof -nP -iTCP:"$PORT_NUM" -sTCP:LISTEN >/dev/null 2>&1; do
  echo "  端口 $PORT_NUM 已被占用，尝试 $((PORT_NUM+1)) …"
  PORT_NUM=$((PORT_NUM+1))
done

URL="http://localhost:$PORT_NUM/"
ADMIN="http://localhost:$PORT_NUM/admin"

echo "  即将启动： $URL"
echo ""
echo "  启动后会自动打开浏览器。如果没自动打开，手动复制上面的地址到浏览器。"
echo ""
echo "  详细部署教程（装 Node、放到云服务器上线、Windows 用法）："
echo "  用浏览器打开本文件夹里的 deploy-guide.html"
echo ""

# 4. 后台打开浏览器（等 2 秒让服务先起来）
( sleep 2; command -v open >/dev/null 2>&1 && open "$URL" || xdg-open "$URL" >/dev/null 2>&1 ) &

echo "================================================"
echo "  下面开始输出运行日志（保持本窗口开着）"
echo "================================================"
echo ""

# 5. 启动服务
PORT=$PORT_NUM exec node server/app.js
