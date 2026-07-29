#!/usr/bin/env bash
set -euo pipefail

CLIENT_DIR="/Applications/ZealousTicketUserClient"
mkdir -p "${CLIENT_DIR}"

cat > "${CLIENT_DIR}/client-url.txt" <<'EOF'
http://localhost:3000/user-login.html
EOF

cat > "${CLIENT_DIR}/open-user-login.command" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
URL="$(head -n 1 client-url.txt | tr -d '\r')"
if [[ -z "${URL}" ]]; then
  URL="http://localhost:3000/user-login.html"
fi
open "${URL}"
EOF

chmod +x "${CLIENT_DIR}/open-user-login.command"

echo "User client installed."
echo "Run: ${CLIENT_DIR}/open-user-login.command"
echo "Edit URL here if server is remote: ${CLIENT_DIR}/client-url.txt"
