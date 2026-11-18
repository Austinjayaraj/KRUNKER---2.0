#!/usr/bin/env bash
# Standalone Desktop Launcher for Linux & macOS
set -e

echo "========================================================="
echo "   KRUNKER 3D FPS - PYTHON PANDA3D DESKTOP ENGINE"
echo "========================================================="

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed. Please install Python 3.10+ from python.org"
    exit 1
fi

echo "[1/3] Checking dependencies (panda3d, numpy)..."
pip install -r krunker_recreation/requirements.txt --quiet || true

echo "[2/3] Verifying Python engine unit tests..."
python3 -m unittest discover -s krunker_recreation/tests

echo "[3/3] Launching Python 3D desktop arena..."
python3 run_krunker.py "$@"
