const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const UsageService = require('../services/usage-service');
const TrayManager = require('./tray-manager');

class AppManager {
    constructor() {
        this.usageService = new UsageService();
        this.trayManager = new TrayManager(this);
        this.detailsWindow = null;
        this.currentUsageData = null;
        this.currentPeriod = 'month';
    }

    start() {

        this.trayManager.createTray();
        this.setupIpcHandlers();
        this.fetchAndDistributeUsageData();
        setInterval(() => this.fetchAndDistributeUsageData(), 30 * 1000);


        app.on('activate', () => {

            if (BrowserWindow.getAllWindows().length === 0) {
                this.showDetailsWindow();
            }
        });
    }

    setupIpcHandlers() {
        ipcMain.on('set-period', (event, period) => {
            if (this.currentPeriod !== period) {
                this.currentPeriod = period;
                this.fetchAndDistributeUsageData();
            }
        });

        ipcMain.on('refresh-usage', () => {
            this.fetchAndDistributeUsageData();
        });

        ipcMain.handle('get-initial-usage', async () => {
            if (!this.currentUsageData) {
                await this.fetchAndDistributeUsageData();
            }
            return this.currentUsageData;
        });
    }

    async fetchAndDistributeUsageData() {
        try {
            const usageData = await this.usageService.getUsage(this.currentPeriod);
            this.currentUsageData = usageData;

            this.trayManager.updateTrayTitle(this.currentUsageData);

            if (this.detailsWindow && !this.detailsWindow.isDestroyed()) {
                this.detailsWindow.webContents.send('update-usage', this.currentUsageData);
            }
        } catch (error) {
            console.error('Failed to fetch and distribute usage data:', error);
            const errorData = { error: 'Could not fetch usage data.' };
            this.currentUsageData = errorData;
            this.trayManager.updateTrayTitle(errorData);
            if (this.detailsWindow && !this.detailsWindow.isDestroyed()) {
                this.detailsWindow.webContents.send('update-usage', errorData);
            }
        }
    }

    showDetailsWindow() {
        if (this.detailsWindow && !this.detailsWindow.isDestroyed()) {
            this.detailsWindow.focus();
            return;
        }

        this.detailsWindow = new BrowserWindow({
            width: 900,
            height: 750,
            show: false,
            title: 'Claude Usage Details',
            webPreferences: {
                preload: path.join(__dirname, '../preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                spellcheck: false,
            }
        });

        this.detailsWindow.loadFile(path.join(__dirname, '../index.html'));

        this.detailsWindow.once('ready-to-show', () => {
            this.detailsWindow.show();
        });

        this.detailsWindow.on('closed', () => {
            this.detailsWindow = null;
        });
    }
}

module.exports = AppManager;
