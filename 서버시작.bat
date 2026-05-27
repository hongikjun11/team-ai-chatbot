@echo off
title T2SEMI AI 챗봇 서버
set PATH=C:\Users\홍익준\AppData\Local\node-portable;%PATH%
cd /d "%~dp0"
echo.
echo  ====================================
echo   T2SEMI 경영기획그룹 AI 챗봇 서버
echo  ====================================
echo.
echo  서버 시작 중... (잠시 기다려주세요)
echo  접속 주소: http://localhost:3001
echo.
echo  ※ 이 창을 닫으면 서버가 종료됩니다
echo  ====================================
echo.
"C:\Users\홍익준\AppData\Local\node-portable\node.exe" "C:\Users\홍익준\AppData\Local\node-portable\node_modules\npm\bin\npm-cli.js" run dev -- -p 3001
pause
