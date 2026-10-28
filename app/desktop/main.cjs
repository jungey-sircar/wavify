const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const API_PORT = 8000;
let backend;

function backendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "wavify-server.exe");
  }
  return path.join(__dirname, "..", "..", "backend", "bin", "wavify-server.exe");
}

function waitForBackend(timeoutMs = 15000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`http://127.0.0.1:${API_PORT}/`, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Wavify could not start its local music service."));
        return;
      }
      setTimeout(check, 250);
    };
    check();
  });
}

async function startBackend() {
  const executable = backendPath();
  if (!fs.existsSync(executable)) {
    throw new Error(`Missing Wavify service: ${executable}`);
  }
  backend = spawn(executable, [], {
    env: { ...process.env, PORT: String(API_PORT) },
    windowsHide: true,
    stdio: "ignore",
  });
  backend.once("error", (error) => {
    console.error("Wavify backend failed:", error);
  });
  await waitForBackend();
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#121212",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (error) {
    dialog.showErrorBox("Wavify could not start", error.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backend && !backend.killed) backend.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backend && !backend.killed) backend.kill();
});
