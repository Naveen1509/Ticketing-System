# Installer Files (Windows / Linux / macOS)

This folder now supports:

1. Windows installer files
- `AdminServerSetup.iss`
- `UserClientSetup.iss`

2. Linux installer scripts
- `linux/install-server.sh`
- `linux/install-client.sh`

3. macOS installer scripts
- `macos/install-server.sh`
- `macos/install-client.sh`

---

## 1) Windows

### Prerequisites
- Node.js installed on server machine
- Inno Setup 6

### Build
1. Open `installer\AdminServerSetup.iss` in Inno Setup
2. Compile
3. Open `installer\UserClientSetup.iss`
4. Compile

Output goes to: `installer\output\`

---

## 2) Linux (Ubuntu/Debian/RHEL/etc.)

Run from project root:

```bash
chmod +x installer/linux/*.sh
sudo ./installer/linux/install-server.sh
sudo ./installer/linux/install-client.sh
```

What it does:
- Server install to `/opt/zealous-ticket-server`
- Creates systemd service: `zealous-ticket-server.service`
- Admin/User desktop launchers
- Client launcher with URL file: `/opt/zealous-ticket-user-client/client-url.txt`

---

## 3) macOS

Run from project root:

```bash
chmod +x installer/macos/*.sh
./installer/macos/install-server.sh
./installer/macos/install-client.sh
```

What it does:
- Server install to `/Applications/ZealousTicketServer`
- Start script and login launcher scripts
- Client launcher with URL file:
  `/Applications/ZealousTicketUserClient/client-url.txt`

---

## Client URL Configuration (all OS)

Set user-client URL to your hosted server:

- Windows: `C:\Program Files\Zealous Ticket User Client\client-url.txt`
- Linux: `/opt/zealous-ticket-user-client/client-url.txt`
- macOS: `/Applications/ZealousTicketUserClient/client-url.txt`

Example:

`http://192.168.1.20:3000/user-login.html`

### Network deployment and per-network URL

For network deployments where each network uses a different server URL, place a file named `client-url.txt`
next to the installer executable on the network share before running the installer. The installer will detect
that file at install time and copy it into the installed application folder, overriding the packaged default.

Examples (from the network share):

PowerShell (interactive):
```powershell
Start-Process -FilePath ".\ZealousTicketUserClientInstaller.exe" -Wait
```

Silent install (suitable for SCCM / PDQ / GPO):
```powershell
\path\to\share\ZealousTicketUserClientInstaller.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
```

Notes:
- If `client-url.txt` is present next to the installer executable on the share, it will be copied to the
  installation folder (for example `C:\Program Files\Zealous Ticket User Client\client-url.txt`).
- For group-deployed installs you can include a pre-generated `client-url.txt` per network share so each
  target site gets the correct server URL automatically.

---

## Access and Modifications

- Admin and User are already separate logins.
- Access control is role-based.
- You can continue modifying both admin and user pages in this project and rebuild installers anytime.
