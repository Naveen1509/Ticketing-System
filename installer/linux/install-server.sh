#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/zealous-ticket-server"
SERVICE_FILE="/etc/systemd/system/zealous-ticket-server.service"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Installing Zealous Ticket Server to ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo find "${APP_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -R "${PROJECT_ROOT}/." "${APP_DIR}/"
sudo rm -rf "${APP_DIR}/.git" "${APP_DIR}/installer/output" 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js, then re-run this script."
  exit 1
fi

echo "Creating systemd service..."
sudo tee "${SERVICE_FILE}" >/dev/null <<EOF
[Unit]
Description=Zealous Ticket Server
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=$(command -v node) ${APP_DIR}/Server.js
Restart=always
RestartSec=3
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable zealous-ticket-server.service
sudo systemctl restart zealous-ticket-server.service

echo "Server installed and started."
echo "Admin Login: http://localhost:3000/admin-login.html"
