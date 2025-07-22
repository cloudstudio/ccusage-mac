# Claude Usage Monitor

A macOS desktop application that monitors Claude AI usage directly from the system toolbar.

![Claude Usage Monitor](https://img.shields.io/badge/Platform-macOS-blue)
![Electron](https://img.shields.io/badge/Built%20with-Electron-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📱 Features

- **Real-time monitoring**: View Claude usage costs directly in the macOS toolbar
- **Automatic updates**: Data refreshes every 30 seconds
- **Multiple filter periods**: 
  - Last 7 Days
  - Daily
  - Last Month (default)
  - All Time
- **Detailed interface**: Full window with usage charts, tokens and costs
- **Loading states**: Visual indicators during data loading
- **Adaptive theme**: Automatically adapts to system light/dark theme

## 🚀 Installation

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **Yarn** or **npm**
3. **ccusage**: You need to install ccusage globally first

### Install ccusage

First, install ccusage from the official repository:

```bash
# Install ccusage globally
npm install -g ccusage

# Or using yarn
yarn global add ccusage
```

For more information about ccusage, visit: https://github.com/ryoppippi/ccusage

### Development Installation

```bash
# Clone the repository
git clone <your-repository>
cd mac-claude-usage

# Install dependencies
yarn install

# Run the application in development mode
yarn start
```

## 🔧 Usage

### First Time Setup
1. Launch the application
2. The app will appear in your toolbar showing "Loading..."
3. After a few seconds, it will display the current cost (e.g., "$25.40")

### Interaction
- **Right-click** on the tray icon to open the context menu
- **"Show Usage Details"** to open the detailed window
- **Period filters** available in the context menu
- **Refresh button** to manually update data

### Details Window
- Cost summary for selected period
- Detailed table with all usage blocks
- Token information (input, output, cache)
- Current burn rate if there's active usage

## ⚙️ Configuration

### Update Frequency
Data updates automatically every **30 seconds**. You can change this in `src/managers/app-manager.js`:

```javascript
setInterval(() => this.fetchAndDistributeUsageData(), 30 * 1000); // 30 seconds
```

### Default Period
The application starts with "Last Month" filter. To change this, modify in `src/managers/app-manager.js`:

```javascript
this.currentPeriod = 'month'; // Options: 'daily', '7days', 'month', 'total'
```

## 🛠️ Development

### Available Scripts

- `yarn start` - Run the application in normal mode
- `yarn dev` - Run the application with debug inspector

### Project Structure

```
mac-claude-usage/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script for secure communication
│   ├── index.html           # Main interface
│   ├── renderer.js          # Interface logic
│   ├── managers/
│   │   ├── app-manager.js   # Main application manager
│   │   └── tray-manager.js  # Tray icon manager
│   ├── services/
│   │   └── usage-service.js # Service to get ccusage data
│   └── assets/
│       ├── claude.png       # Claude logo
│       └── styles.css       # CSS styles
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

### Key Dependencies

- **Electron**: Framework for desktop applications
- **ccusage**: Library to get Claude usage data

## 🔍 Troubleshooting

### The application doesn't appear in the tray
- Verify that you have permissions to create icons in the toolbar
- Restart the application

### "ccusage not found" or related errors
- Make sure ccusage is installed globally: `npm install -g ccusage`
- Run `yarn install` to ensure all dependencies are installed

### No data is displayed
- Verify that you have Claude usage recorded
- Check your ccusage configuration
- Review the Electron console (`yarn dev`) for errors

### The application doesn't update
- Data updates automatically every 30 seconds
- Use the "Refresh" button to force a manual update

## 📝 License

MIT License - You can use, modify and distribute this project freely.

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have suggestions, please:
1. Review the Troubleshooting section
2. Run `yarn dev` to see debug logs
3. Create an issue in the repository with problem details

---

**Enjoy monitoring your Claude AI usage! 🚀**
