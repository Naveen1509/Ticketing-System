const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let serverError = null;
let crashLogPath = "";

// Start the Express server with safe error catching
try {
  require("./Server.js");
} catch (error) {
  serverError = error;
  try {
    const userDataPath = app.getPath("userData");
    crashLogPath = path.join(userDataPath, "crash-log.txt");
    fs.writeFileSync(
      crashLogPath,
      `Error starting server:\n${error.stack || error.message || error}\n`
    );
  } catch (e) {
    console.error("Failed to write crash log:", e);
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (serverError) {
    dialog.showErrorBox(
      "Server Startup Error",
      `The backend server failed to start.\n\nError details:\n${serverError.message}\n\nA crash log has been written to:\n${crashLogPath || "App Data Directory"}`
    );
    return;
  }

  mainWindow.loadURL("http://localhost:3000/");

  let retryCount = 0;
  const maxRetries = 20; // Retry for 5 seconds total

  mainWindow.webContents.on("did-fail-load", () => {
    if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.loadURL("http://localhost:3000/");
        }
      }, 250);
    } else {
      dialog.showErrorBox(
        "Connection Error",
        "Failed to connect to the local server. The server might have failed to start or port 3000 is blocked."
      );
    }
  });

  // Open the DevTools (inside createWindow to avoid TypeError)
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});