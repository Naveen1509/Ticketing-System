# macOS Installer Guide

## Files
- `install-server.sh` -> installs Admin/Server app
- `install-client.sh` -> installs User/Client launcher

## Prerequisites
- macOS machine
- Node.js installed on server machine
- Terminal access

## Install Server (Admin)

From project root:

```bash
chmod +x installer/macos/install-server.sh
./installer/macos/install-server.sh
```

This will:
- Copy app to `/Applications/ZealousTicketServer`
- Create launcher:
  - `/Applications/ZealousTicketServer/start-admin-server.command`

Run server:

```bash
/Applications/ZealousTicketServer/start-admin-server.command
```

Admin login URL:
- `http://localhost:3000/admin-login.html`

## Install Client (User)

```bash
chmod +x installer/macos/install-client.sh
./installer/macos/install-client.sh
```

This will create:
- `/Applications/ZealousTicketUserClient/open-user-login.command`
- `/Applications/ZealousTicketUserClient/client-url.txt`

Run user launcher:

```bash
/Applications/ZealousTicketUserClient/open-user-login.command
```

Client URL config:
- `/Applications/ZealousTicketUserClient/client-url.txt`

Example remote server URL:
- `http://192.168.1.20:3000/user-login.html`

## Update
- Re-run install scripts after code updates.

## Uninstall

```bash
sudo rm -rf /Applications/ZealousTicketServer
sudo rm -rf /Applications/ZealousTicketUserClient
```
