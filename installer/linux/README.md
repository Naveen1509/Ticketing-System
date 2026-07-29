# Linux Installer Guide

## Files
- `install-server.sh` -> installs Admin/Server app
- `install-client.sh` -> installs User/Client launcher

## Prerequisites
- Linux machine
- Node.js installed on server machine
- `sudo` access

## Install Server (Admin)

From project root:

```bash
chmod +x installer/linux/install-server.sh
sudo ./installer/linux/install-server.sh
```

This will:
- Copy app to `/opt/zealous-ticket-server`
- Create `systemd` service `zealous-ticket-server.service`
- Enable and start service automatically

Admin login URL:
- `http://localhost:3000/admin-login.html`

## Server Service Commands

```bash
sudo systemctl status zealous-ticket-server
sudo systemctl restart zealous-ticket-server
sudo systemctl stop zealous-ticket-server
sudo journalctl -u zealous-ticket-server -f
```

## Install Client (User)

```bash
chmod +x installer/linux/install-client.sh
sudo ./installer/linux/install-client.sh
```

This will:
- Create launcher in `/opt/zealous-ticket-user-client`
- Add desktop app shortcut

Client URL config:
- `/opt/zealous-ticket-user-client/client-url.txt`

Example remote server URL:
- `http://192.168.1.20:3000/user-login.html`

## Update
- Re-run install scripts after code updates.

## Uninstall

```bash
sudo systemctl stop zealous-ticket-server
sudo systemctl disable zealous-ticket-server
sudo rm -f /etc/systemd/system/zealous-ticket-server.service
sudo systemctl daemon-reload
sudo rm -rf /opt/zealous-ticket-server
sudo rm -rf /opt/zealous-ticket-user-client
sudo rm -f /usr/share/applications/zealous-ticket-user.desktop
```
