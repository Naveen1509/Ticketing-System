# Ticket System Desktop Application

This repository contains an Express-based ticket system accompanied by static
HTML/JS pages for both admin and user roles.  To make the system available as a
stand‑alone desktop application, an Electron wrapper has been added.  The same
API is used by the web and desktop clients.

## Running the Application (Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the desktop app:
   ```bash
   npm start
   ```

   This command launches Electron, which in turn forks the existing `Server.js`
   process and opens a window pointed at `http://localhost:3000/`.

3. Log in using the default credentials (`admin`/`admin`) or create new users
   via the admin interface.

4. By default the generic login page is displayed.  You may navigate directly to
   `/admin-login` or `/user-login` if you prefer.

## Running Just the Server

If you only want to run the web server (e.g. to use the system in a browser):

```bash
npm run server
```

It will listen on port 3000 by default.

## Packaging for Distribution

The project uses [electron-builder](https://www.electron.build/) to create
platform-specific installers.

```bash
# prepare an unpacked build in ./dist
npm run pack

# create installer(s)
npm run dist
```

The `build` section in `package.json` configures the application ID and
resources; adjust as needed.  Windows, macOS, and Linux installers are
supported.

## Notes

* The IPC between the Electron UI and the Express server is done entirely over
  HTTP; no additional bridge code is required.
* The server writes its SQLite database (`tickets.db`) next to the application
  code; for a real deployment you may want to relocate that to a user-specific
  data directory.
* Electron's `nodeIntegration` is disabled in the renderer for security.  Only
  the trusted server content is shown in the window.
* Use the **Portal** menu in the desktop app to quickly switch between the
  normal user login and the admin login page (or simply navigate manually).

---

Feel free to modify the front-end files under `Public/` if you want to change
the user experience, or build a more advanced UI using a framework such as
React or Vue.