const { app, Tray, Menu, nativeTheme, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
    constructor(appManager) {
        this.appManager = appManager;
        this.tray = null;
    }

    createTray() {
        try {
            const icon = this.getIcon();
            this.tray = new Tray(icon);
            this.tray.setToolTip('Claude Usage Monitor');
            this.tray.setTitle('Loading...');
            this.updateContextMenu();


            nativeTheme.on('updated', () => {
                if (this.tray && !this.tray.isDestroyed()) {
                    this.tray.setImage(this.getIcon());
                }
            });
        } catch (error) {
            console.error('Failed to create tray:', error);
        }
    }

    getIcon() {
        try {

            const possiblePaths = [
                path.join(app.getAppPath(), 'src', 'assets', 'claude.png'),
                path.join(app.getAppPath(), 'assets', 'claude.png'),
                path.join(__dirname, '..', 'assets', 'claude.png'),
                path.join(process.resourcesPath, 'app', 'src', 'assets', 'claude.png')
            ];

            let iconPath = null;
            for (const testPath of possiblePaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(testPath)) {
                        iconPath = testPath;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (iconPath) {
                const image = nativeImage.createFromPath(iconPath);
                if (!image.isEmpty()) {
                    const resizedImage = image.resize({ width: 16, height: 16 });
                    resizedImage.setTemplateImage(true);
                    return resizedImage;
                }
            }

            const fallbackIcon = nativeImage.createFromDataURL('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjciIGZpbGw9IiNmZjZiMzUiLz4KPHR0ZXh0IHg9IjgiIHk9IjExIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+QzwvdGV4dD4KPC9zdmc+');
            fallbackIcon.setTemplateImage(true);
            return fallbackIcon;
        } catch (error) {
            console.error('Error creating tray icon:', error);
            return nativeImage.createEmpty();
        }
    }

    updateContextMenu() {
        const currentPeriod = this.appManager.currentPeriod;
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Usage Details',
                click: () => this.appManager.showDetailsWindow(),
            },
            { type: 'separator' },
            {
                label: 'Filter Period',
                submenu: [
                    { label: 'Last 7 Days', type: 'radio', checked: currentPeriod === '7days', click: () => this.setPeriod('7days') },
                    { label: 'Daily', type: 'radio', checked: currentPeriod === 'daily', click: () => this.setPeriod('daily') },
                    { label: 'Last Month', type: 'radio', checked: currentPeriod === 'month', click: () => this.setPeriod('month') },
                    { label: 'All Time', type: 'radio', checked: currentPeriod === 'total', click: () => this.setPeriod('total') },
                ]
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => app.quit(),
            },
        ]);

        if (this.tray && !this.tray.isDestroyed()) {
            this.tray.setContextMenu(contextMenu);
        }
    }

    setPeriod(period) {
        // Show loading immediately
        if (this.tray && !this.tray.isDestroyed()) {
            this.tray.setTitle('Loading...');
        }

        this.appManager.currentPeriod = period;
        this.appManager.fetchAndDistributeUsageData();
        this.updateContextMenu();
    }

    updateTrayTitle(usageData) {
        if (!this.tray || this.tray.isDestroyed()) return;

        let title = ' ⏳';
        if (usageData) {
            if (usageData.error) {
                title = ' ⚠️ Error';
            } else if (typeof usageData.total_cost !== 'undefined') {
                const cost = usageData.total_cost.toFixed(2);
                title = ` $${cost}`;
            }
        }
        this.tray.setTitle(title);
    }
}

module.exports = TrayManager;
