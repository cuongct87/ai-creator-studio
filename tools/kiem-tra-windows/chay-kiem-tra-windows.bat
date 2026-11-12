@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Artio - tu kiem tra ban Windows
echo === Artio: tu kiem tra ban Windows ===
echo Can: da cai "artio-windows-ban-kiem-tra". Dung cham chuot/ban phim trong luc chay (khoang 1 phut).
echo.
node kiem-tra-windows.mjs
echo.
echo Xong. Nhan tin cho Claude: "chay xong roi".
pause
