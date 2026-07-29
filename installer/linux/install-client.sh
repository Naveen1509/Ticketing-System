#!/usr/bin/env bash
set -euo pipefail

CLIENT_DIR="/opt/zealous-ticket-user-client"
DESKTOP_FILE="/usr/share/applications/zealous-ticket-user.desktop"

echo "Installing Zealous Ticket User Client to ${CLIENT_DIR}"
sudo mkdir -p "${CLIENT_DIR}"

sudo tee "${CLIENT_DIR}/open-user-login.sh" >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
CONFIG_FILE="$(dirname "$0")/client-url.txt"
URL="http://localhost:3000/user-login.html"
if [[ -f "${CONFIG_FILE}" ]]; then
  CANDIDATE="$(head -n 1 "${CONFIG_FILE}" | tr -d '\r')"
  if [[ -n "${CANDIDATE}" ]]; then
    URL="${CANDIDATE}"
  fi
fi
xdg-open "${URL}" >/dev/null 2>&1 &
EOF

echo "http://localhost:3000/user-login.html" | sudo tee "${CLIENT_DIR}/client-url.txt" >/dev/null
sudo chmod +x "${CLIENT_DIR}/open-user-login.sh"

sudo tee "${DESKTOP_FILE}" >/dev/null <<EOF
[Desktop Entry]
Name=Zealous Ticket User Login
Comment=Open user login page
Exec=${CLIENT_DIR}/open-user-login.sh
Terminal=false
Type=Application
Categories=Network;
EOF

echo "Client installed."
echo "Edit URL here if server is remote: ${CLIENT_DIR}/client-url.txt"
