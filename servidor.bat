@echo off
cd /d "%~dp0"
echo Abrindo em http://localhost:8124
start http://localhost:8124
python -m http.server 8124
pause
