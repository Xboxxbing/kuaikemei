@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 快可美 quick-mix 官网

REM ============================================================
REM   快可美官网 · 一键启动（Windows）
REM   用法：双击本文件即可
REM ============================================================

cd /d "%~dp0"

cls
echo.
echo ================================================
echo   快可美 quick-mix 官网 · 启动程序
echo ================================================
echo.

REM 1. 检查 Node 是否安装
where node >nul 2>nul
if errorlevel 1 (
  echo   [X] 没有检测到 Node.js
  echo.
  echo   请先安装 Node.js（只要装一次）：
  echo.
  echo   打开 https://nodejs.org
  echo   下载左边的 LTS 版本（比如 20.x LTS），双击安装，
  echo   安装过程中全部点"下一步"即可。
  echo.
  echo   装完后，关闭这个窗口，重新双击本文件。
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%i in ('node -v') do set NODEV=%%i
echo   [OK] Node.js 已安装：%NODEV%
echo.

REM 2. 端口设置（默认 3000，想改就改这里的数字）
set PORT_NUM=3000

REM 3. 端口占用就自动换一个
:checkport
netstat -ano | findstr ":%PORT_NUM% " | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo   端口 %PORT_NUM% 已被占用，尝试下一个…
  set /a PORT_NUM+=1
  if !PORT_NUM! gtr 3010 (
    echo   3000~3010 都被占用，请先关闭其它程序
    pause
    exit /b 1
  )
  goto checkport
)

set URL=http://localhost:%PORT_NUM%/

echo   即将启动： %URL%
echo.
echo   启动后会自动打开浏览器。如果没自动打开，
echo   手动把上面的地址复制到浏览器即可。
echo.
echo   详细部署教程（装 Node、放到云服务器上线）：
echo   用浏览器打开本文件夹里的 deploy-guide.html
echo.
echo ================================================
echo   下面开始输出运行日志（保持本窗口开着）
echo ================================================
echo.

REM 4. 延迟打开浏览器
start "" cmd /c "timeout /t 2 >nul & start "" %URL%"

REM 5. 启动服务
set PORT=%PORT_NUM%
node server/app.js

echo.
echo   服务已停止。
pause
