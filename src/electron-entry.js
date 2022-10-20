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
const path = require('path');
const activeWindows = require('electron-active-window');
const activeWindowPage = require('active-win');
const BMParser = require('bookmark-parser');
const axios = require('axios');
const uiohook = require('uiohook-napi');
const { autoUpdater } = require("electron-updater");
const debug = require('debug')('Franz:ipcApi:autoUpdate');
const dns = require("dns");
const activity = { is_mouse: 0, is_keyboard: 0 };
const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Origin": "*",
    "Accept": "application/json"
}
const sessionUser = null;
let updateInterval = null;
const rax = require('retry-axios');

app.disableHardwareAcceleration();
electron.powerSaveBlocker.start('prevent-app-suspension');
//electron.commandLine.appendSwitch ("disable-http-cache");

// Change App Name on Windows
if (process.platform === 'win32')
{
    app.setAppUserModelId('Rubii');
}

let apiEndpoint = 'https://rubii.com/api'; // By default, we are in production
let frameUrl = 'https://desktop.rubii.com';

//apiEndpoint = "http://creaz:81/xorix/api"; // Brian
//frameUrl = 'http://localhost:3000'; // Brian

//if (isDev) { // or if(process.env.NODE_ENV)
//    apiEndpoint = "http://creaz:81/xorix/api";
//    frameUrl = 'http://localhost:3000';
//}

var internetAvailable = require("internet-available");

let isConnected = false;
let counterInternet = 0;
let allowSendInternetNotification = 1;

async function liveInternetCheck() {

    var userSessionCheck = await getSessionUser();

    // Most easy way
    internetAvailable({
        domainName: "rubii.com",
        // Provide maximum execution time for the verification
        timeout: 10000,
        // If it tries 10 times and it fails, then it will throw no internet
        retries: 10
    }).then(() => {
        // Available Internet
        isConnected = true;
        counterInternet++;
        if(counterInternet > 3 && allowSendInternetNotification == 0) {
            allowSendInternetNotification = 1;
        }
    }).catch(() => {
        // Not available internet
        isConnected = false;
        if(isConnected == false && userSessionCheck && allowSendInternetNotification == 1) {
            var message = 'Your internet has been disconnected! Please login again';
            new notification({ title: 'Ooops', body: message }).show();
            // Logout the user in the other end
            win.webContents.send("terminate-timer", "hello");
            allowSendInternetNotification = 0;
            counterInternet = 0;
        }
    });

}

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
        buttons: ['Restart'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    });
});

function checkUpdate() {
    updateInterval = setInterval(() => autoUpdater.checkForUpdates(), 600000);
}

let win;


ipcMain.on('bad-internet', (evt, arg) => {
    new notification({ title: 'Ooops', body: 'There is something wrong with your network! Please login again' }).show();
    win.webContents.reload();
});

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

    if (user && timer) {

        if (timer.timer == 1) {

            //console.log('Gathering screens...');

            //console.log(app.getPath('pictures'));
            const thumbSize = determineScreenShotSize();
            const workaroundTimestamp = Date.now();

            const options = {
                types: ['screen'],
                thumbnailSize: { ...thumbSize, workaroundTimestamp }
            };

            desktopCapturer.getSources(options).then((sources) => {
                console.log('Sources received:' + sources.length);

                sources.forEach(function (source) {
                    const sourceName = source.name.toLowerCase();
                    //console.log(sourceName);
                    if (['entire screen', 'screen 1'].includes(sourceName)) {

                        var the_screenshot = source.thumbnail.toPNG();

                        var data = {
                            user_id: user.id,
                            company_id: timer.company_id,
                            image: the_screenshot.toString('base64')
                        }

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

        if (user && timer) {

            if (timer.timer == 1) {
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
            if (result) {
                return JSON.parse(result);
            }
        });
}

function getSessionTimer() {
    return win.webContents.executeJavaScript('sessionStorage.getItem("timer");', true)
        .then(result => {
            if (result) {
                return JSON.parse(result);
            }
        });
}

async function generateActivity() {

    win.webContents.send("set-activity", activity);
    // We reset after we send it
    activity.is_mouse = activity.is_keyboard = 0;

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
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    //win.loadURL('https://desktop.rubii.com');
    win.loadURL(frameUrl, { "extraHeaders": "pragma: no-cache\n" });

    // http://localhost:3000
    //win.webContents.openDevTools();

    win.removeMenu(); // Brian
    // or set the Menu to null
    win.setMenu(null); // Brian

    // Reload cache
    win.webContents.reloadIgnoringCache();

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
    uiohook.uIOhook.start();

    win.on('close', function () {
        win = null;
    })

}

app.whenReady().then(createWindow).then(checkUpdate);

app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    if (win == null) {
        createWindow();
    }
})

setInterval(takeScreenshot, 10 * 60 * 1000); // 10 minutes
setInterval(saveSoftware, 5 * 1000); // 5 seconds
setInterval(generateActivity, 1 * 1000);
//setInterval(function() { liveInternetCheck(); }, 10 * 1000); // 10 seconds