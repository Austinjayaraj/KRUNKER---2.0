@echo off
REM Standalone Desktop Launcher for Windows
echo =========================================================
echo    KRUNKER 3D FPS - PYTHON PANDA3D DESKTOP ENGINE
echo =========================================================

python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not detected in PATH.
    echo Please install Python 3.10+ from https://python.org and check "Add Python to PATH"
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -r krunker_recreation\requirements.txt

echo [2/3] Running Python unit tests...
python -m unittest discover -s krunker_recreation\tests

echo [3/3] Launching Panda3D desktop client...
python run_krunker.py %*
pause
