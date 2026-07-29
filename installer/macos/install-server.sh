#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/Applications/ZealousTicketServer"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "Installing Zealous Ticket Server to ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo find "${APP_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -R "${PROJECT_ROOT}/." "${APP_DIR}/"
sudo rm -rf "${APP_DIR}/.git" "${APP_DIR}/installer/output" 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required on macOS server machine. Install Node.js and re-run."
  exit 1
fi

cat > "${APP_DIR}/start-admin-server.command" <<'EOF'
#!/usr/bin/env bash
cd "$(dirname "$0")"
open "http://localhost:3000/admin-login.html"
node Server.js
EOF

chmod +x "${APP_DIR}/start-admin-server.command"

echo "Server installed."
echo "Run: ${APP_DIR}/start-admin-server.command"
