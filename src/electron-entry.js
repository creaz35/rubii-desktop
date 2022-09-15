const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;
const desktopCapturer = electron.desktopCapturer;
const idle = electron.powerMonitor;
const remote = electron.remote;
const notification = electron.Notification;
const globalShortcut = electron.globalShortcut;
const screen = electron.screen;
const ipcMain = electron.ipcMain;
const app = electron.app;
const isDev = require('electron-is-dev');
const fs = require('fs');
const path = require('path');
const os = require('os')
const activeWindows = require('electron-active-window');
const activeWindowPage = require('active-win');
const BMParser = require('bookmark-parser');
const axios = require('axios'); 
const uiohook = require('uiohook-napi');
const { autoUpdater } = require("electron-updater");
const debug = require('debug')('Franz:ipcApi:autoUpdate');
const activity = { is_mouse: 0, is_keyboard: 0 };
const headers = {
    'Content-Type': 'application/json;charset=UTF-8', 
    "Access-Control-Allow-Headers": "*", 
    "Access-Control-Allow-Origin": "*", 
    "Accept": "application/json"
}
const sessionUser = null;
let updateInterval = null;

app.disableHardwareAcceleration();

let apiEndpoint = 'https://rubii.com/api'; // By default, we are in production
let frameUrl = 'https://desktop.rubii.com';

//apiEndpoint = "http://creaz:81/xorix/api";
//frameUrl = 'http://localhost:3000';

//if (isDev) { // or if(process.env.NODE_ENV)
//    apiEndpoint = "http://creaz:81/xorix/api";
//    frameUrl = 'http://localhost:3000';
//}

autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
       type: 'info',
       buttons: ['Ok'],
       title: 'Update Available',
       message: process.platform === 'win32' ? releaseNotes : releaseName,
       detail: 'A new version download started. The app will be restarted to install the update.'
    };
    dialog.showMessageBox(dialogOpts);
    updateInterval = null;
});

autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
       type: 'info',
       buttons: ['Restart', 'Later'],
       title: 'Application Update',
       message: process.platform === 'win32' ? releaseNotes : releaseName,
       detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
       if (returnValue.response === 0) autoUpdater.quitAndInstall()
    });
});

function checkUpdate () {
    updateInterval = setInterval(() => autoUpdater.checkForUpdates(), 600000);
}

let win;

ipcMain.on('close-me', (evt, arg) => {
    new notification({ title: 'Ooops', body: 'We hope to see you again!' }).show();
    app.quit()
});

function determineScreenShotSize() {

    var screenSize = screen.getPrimaryDisplay().workAreaSize
    return {
        width: screenSize.width,
        height: screenSize.height
    }
}

async function takeScreenshot() {

    var user = await getSessionUser();
    var timer = await getSessionTimer();

    if(user && timer) {

        if(timer.timer == 1) {

            //console.log('Gathering screens...');

            //console.log(app.getPath('pictures'));
            const thumbSize = determineScreenShotSize();
            const workaroundTimestamp = Date.now();

            const options = {
                types: ['screen'],
                thumbnailSize: {... thumbSize, workaroundTimestamp} 
            };

            desktopCapturer.getSources(options).then((sources) => {
                //console.log('Sources received:'+sources.length);

                sources.forEach(function (source) {
                    const sourceName = source.name.toLowerCase();
                    //console.log(sourceName);
                    if ( ['entire screen', 'screen 1'].includes(sourceName)) {

                        var the_screenshot = source.thumbnail.toPNG();

                        var data = {
                            user_id: user.id,
                            company_id: timer.company_id,
                            image: the_screenshot.toString('base64')
                        }

                        console.log(timer);

                        axios.post(apiEndpoint + "/desktop/save_screenshots", data, {
                            headers: headers
                        })
                        .then((response) => {
                        // console.log(response);
                        })
                        .catch((error) => {
                            //console.log(error);
                        })

                    }
                })
            }).catch(console.error);

        }
    }

}

function saveSoftware() {

(async () => {
    var options = [];
    var software = await activeWindowPage();
    var user = await getSessionUser();
    var timer = await getSessionTimer();

    if(user && timer) {

        if(timer.timer == 1) {
            software.user = user;
            software.timer = timer;

            axios.post(apiEndpoint + "/desktop/save_app", software, {
                headers: headers
            })
            .then((response) => {
                //console.log(response);
            })
            .catch((error) => {
                //console.log(error);
            })

        }
    }
})();

}

function getSessionUser() {
    return win.webContents.executeJavaScript('sessionStorage.getItem("user");', true)
    .then(result => {
        if(result) {
           return JSON.parse(result);
        }
    });
}

function getSessionTimer() {
    return win.webContents.executeJavaScript('sessionStorage.getItem("timer");', true)
    .then(result => {
        if(result) {
           return JSON.parse(result);
        }
    });
}

async function generateActivity() {

    var user = await getSessionUser();
    var timer = await getSessionTimer();
    // Now we wait for the async calls to resolve before continuing the execution inside this function.

    if(user && timer) {

        if(timer.timer == 1) {

            activity.user = user;
            activity.timer = timer;

            var data = {
                activity: activity
            }

            axios.post(apiEndpoint + "/desktop/save_activity", data, {
                headers: headers
            })
            .then((response) => {
               // console.log(response);
                activity.is_mouse = activity.is_keyboard = 0;
            })
            .catch((error) => {
                activity.is_mouse = activity.is_keyboard = 0;
                //console.log(error);
            })

        }

    }
    
}

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay; 
}

function createWindow() {

    win = new BrowserWindow({
        width: 1200,
        height: 900,
        frame: true,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    //win.loadURL('https://desktop.rubii.com');
    win.loadURL(frameUrl);
    // http://localhost:3000
    //win.webContents.openDevTools();

    win.removeMenu();
    // or set the Menu to null
    win.setMenu(null);

    // Keyboard activity
    uiohook.uIOhook.on('keydown', (e) => {
        //console.log('Keyboard!')
        activity.is_keyboard = 1;
    })

    // Mouse activity
    uiohook.uIOhook.on('mousemove', (e) => {
        //console.log('mouse');
        activity.is_mouse = 1;
    })

    // Start listener for keyboard and mouse
    uiohook.uIOhook.start()

    win.on('close', function() {
        win = null;
    })

}

app.whenReady().then(createWindow).then(checkUpdate);

app.on('window-all-closed', function() {
    app.quit();
});

app.on('activate', function() {
    if(win == null) {
        createWindow();
    }
})

setInterval(takeScreenshot, 10 * 60 * 1000); // 10 minutes
//setInterval(takeScreenshot, 1 * 60 * 1000); 
setInterval(saveSoftware, 1*1000);
setInterval(generateActivity, 1*1000);