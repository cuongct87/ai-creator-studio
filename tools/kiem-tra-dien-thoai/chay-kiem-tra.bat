@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Artio - tu kiem tra tren dien thoai
echo === Artio: tu kiem tra tren dien thoai ===
echo Cam dien thoai vao laptop, mo khoa man hinh, de man hinh sang.
echo.

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" set "ADB=adb"
"%ADB%" start-server >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay adb. Mo Android Studio ^> SDK Manager ^> SDK Tools ^> tick "Android SDK Platform-Tools".
  pause
  exit /b 1
)
"%ADB%" devices
echo.

node kiem-tra.mjs

if exist "ket-qua\moi-nhat.txt" (
  set /p OUT=<"ket-qua\moi-nhat.txt"
)
if defined OUT (
  "%ADB%" pull /sdcard/artio-kiem-tra.mp4 "%OUT%\video.mp4" >nul 2>nul
  "%ADB%" shell rm -f /sdcard/artio-kiem-tra.mp4 >nul 2>nul
  echo.
  echo Ket qua nam o: %OUT%
)
echo.
echo Xong. Nhan tin cho Claude: "chay xong roi".
pause
