@echo off
chcp 65001 >nul
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo Git이 설치되어 있지 않습니다. https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist .git (
    echo Git 저장소 초기화 중...
    git init
    git remote add origin https://github.com/YURIIEUN/260311.git
    git branch -M main
)

git add .
git status
set msg=로또 번호 추천 서비스 업데이트
set /p input="커밋 메시지 (Enter: %msg%): "
if not "%input%"=="" set msg=%input%
git commit -m "%msg%"
git push -u origin main 2>nul || git push
echo.
echo 완료.
pause
