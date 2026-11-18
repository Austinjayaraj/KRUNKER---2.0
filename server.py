#!/usr/bin/env python3
"""
Native Python Web & API Server for Krunker 3D FPS
Can be run independently with zero external dependencies:
    python3 server.py --port 3000
"""

import sys
import os
import json
import argparse
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class KrunkerPythonHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/python/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status_data = {
                "status": "active",
                "pythonVersion": sys.version.split()[0],
                "framework": "Panda3D 3D Desktop + Custom Python Physics Engine",
                "environment": sys.platform,
                "server": "Native Python HTTP Server"
            }
            self.wfile.write(json.dumps(status_data).encode("utf-8"))
            return

        if self.path == "/api/python/files":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            py_files = []
            for root, _, files in os.walk(BASE_DIR):
                if any(x in root for x in ["__pycache__", ".git", "node_modules"]):
                    continue
                for f in files:
                    if f.endswith(".py"):
                        fpath = os.path.join(root, f)
                        relpath = os.path.relpath(fpath, BASE_DIR)
                        try:
                            with open(fpath, "r", encoding="utf-8") as fp:
                                content = fp.read()
                            py_files.append({
                                "name": f,
                                "relativePath": relpath,
                                "lines": len(content.splitlines()),
                                "content": content
                            })
                        except Exception:
                            pass
            self.wfile.write(json.dumps({"files": py_files}).encode("utf-8"))
            return

        # Fallback to SPA index.html for non-asset routes
        if not os.path.exists(os.path.join(BASE_DIR, self.path.lstrip("/"))) and not self.path.startswith("/api/"):
            self.path = "/index.html"

        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            req_data = json.loads(body)
        except Exception:
            req_data = {}

        if self.path == "/api/python/run-tests":
            res = subprocess.run(
                ["python3", "-m", "unittest", "discover", "-s", "krunker_recreation/tests", "-v"],
                cwd=BASE_DIR,
                capture_output=True,
                text=True
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": res.returncode == 0,
                "output": (res.stdout + "\n" + res.stderr).strip(),
                "exitCode": res.returncode
            }).encode("utf-8"))
            return

        if self.path == "/api/python/benchmark":
            res = subprocess.run(
                ["python3", "run_krunker.py", "--benchmark"],
                cwd=BASE_DIR,
                capture_output=True,
                text=True
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": res.returncode == 0,
                "output": (res.stdout + "\n" + res.stderr).strip()
            }).encode("utf-8"))
            return

        self.send_error(404, "Endpoint not found")

def run(port=PORT):
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, KrunkerPythonHandler)
    print(f"Native Python Web Server listening on http://0.0.0.0:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=PORT)
    args = parser.parse_args()
    run(args.port)
