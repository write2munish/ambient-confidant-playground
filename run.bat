@echo off
:: Startup script for Windows

cls
echo ==========================================================
echo     THE AMBIENT CONFIDANT PLAYGROUND - STARTUP SCRIPT
echo ==========================================================
echo.

:: Check for python in system
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Python is not found on your PATH. Checking Microsoft Store alias...
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo x Python is not installed. Please install Python from the Microsoft Store.
        echo.
        echo OR, close Ollama from the taskbar, then open PowerShell and run:
        echo    $env:OLLAMA_ORIGINS="*"
        echo    ollama serve
        echo Then simply double-click index.html to run!
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [yes] Starting local HTTP server on http://localhost:8000 ...
echo [yes] Open http://localhost:8000 in your browser to run the playground.
echo.
echo [!] Ensure Ollama is running and you have pulled Gemma3:
echo     cmd /k ollama pull gemma3:1b
echo ==========================================================
echo Press Ctrl+C in this command window to stop the server.
echo.

python -m http.server 8000
if %errorlevel% neq 0 (
    python3 -m http.server 8000
)

pause
