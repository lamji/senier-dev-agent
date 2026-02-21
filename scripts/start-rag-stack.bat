@echo off
REM Wrapper to launch Python RAG stack startup script
REM This .bat file can be converted to a shortcut with a custom icon

cd /d "%~dp0.."
python scripts\start-rag-stack.py
pause
