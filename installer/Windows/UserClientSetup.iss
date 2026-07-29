#define MyAppName "Zealous Ticket User Client"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Zealous Studio"

[Setup]
AppId={0F1A31D6-2B79-4A12-9D58-6D5532DAB002}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Zealous Ticket User Client
DefaultGroupName=Zealous Ticket User Client
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=ZealousTicketUserClientInstaller
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
Source: "open-user-login.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "client-url.txt"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist
Source: "..\Images\icon.ico"; DestDir: "{app}\Images"; Flags: ignoreversion
Source: "..\Images\RaisingTicket2.png"; DestDir: "{app}\Images"; Flags: ignoreversion

[Icons]
Name: "{group}\User Login"; Filename: "{cmd}"; Parameters: "/c ""{app}\open-user-login.cmd"""
Name: "{autodesktop}\User Login"; Filename: "{cmd}"; Parameters: "/c ""{app}\open-user-login.cmd"""; Tasks: desktopicon

[Code]
procedure CurStepChanged(CurStep: Integer);
var
	SrcDir, SrcFile, DestFile: string;
begin
	if CurStep = ssPostInstall then
	begin
		SrcDir := ExtractFileDir(ExpandConstant('{srcexe}'));
		SrcFile := AddBackslash(SrcDir) + 'client-url.txt';
		DestFile := ExpandConstant('{app}') + '\\client-url.txt';
		if FileExists(SrcFile) then
		begin
			if not DirExists(ExpandConstant('{app}')) then
				ForceDirectories(ExpandConstant('{app}'));
			if not FileCopy(SrcFile, DestFile, False) then
				MsgBox('Warning: failed to copy client-url.txt from installer location to installation folder.', mbInformation, MB_OK);
		end;
	end;
end;
