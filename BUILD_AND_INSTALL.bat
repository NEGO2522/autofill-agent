@echo off
echo ============================================
echo  AutoSlay Agent - Build ^& Install Script
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building the extension...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. Check the errors above.
    pause
    exit /b 1
)

echo.
echo [3/3] Done! 
echo.
echo ============================================
echo  BUILD SUCCESSFUL
echo ============================================
echo.
echo Next steps:
echo  1. Open Chrome and go to: chrome://extensions
echo  2. Click the RELOAD button (refresh icon) on AutoSlay Agent
echo  3. Click the extension icon - it should work now!
echo.
pause
