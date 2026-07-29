#define MyAppName "Zealous Ticket Server"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Zealous Studio"
#define MyAppExeName "start-admin-server.cmd"

[Setup]
AppId={F6C4A66E-34DA-4D3A-B4C1-3A6A9A8AB001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Zealous Ticket Server
DefaultGroupName=Zealous Ticket Server
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=ZealousTicketServerInstaller
Compression=lzma
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\Images\icon.ico
WizardImageFile=..\Images\RaisingTicket2.png
WizardSmallImageFile=..\Images\icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"

[Files]
Source: "..\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: ".git\*,installer\output\*,tickets.db-shm,tickets.db-wal"
Source: "start-admin-server.cmd"; DestDir: "{app}\installer"; Flags: ignoreversion

[Icons]
Name: "{group}\Start Admin Server"; Filename: "{cmd}"; Parameters: "/c ""{app}\installer\start-admin-server.cmd"""
Name: "{group}\Admin Login"; Filename: "http://localhost:3000/admin-login.html"
Name: "{group}\User Login"; Filename: "http://localhost:3000/user-login.html"
Name: "{autodesktop}\Start Admin Server"; Filename: "{cmd}"; Parameters: "/c ""{app}\installer\start-admin-server.cmd"""; Tasks: desktopicon

[Run]
Filename: "{cmd}"; Parameters: "/c where node"; Flags: runhidden; StatusMsg: "Checking Node.js installation..."
