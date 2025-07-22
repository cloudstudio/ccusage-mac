const { app } = require('electron');
const AppManager = require('./managers/app-manager');


if (!app.requestSingleInstanceLock()) {
    app.quit();
}

let appManager;

app.whenReady().then(() => {

    if (process.platform === 'darwin') {
        app.dock.hide();
    }

    appManager = new AppManager();
    appManager.start();
});


app.on('window-all-closed', () => {});

