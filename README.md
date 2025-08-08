# Digital Wellbeing Timer - Chrome Extension

A Chrome extension designed to promote digital wellbeing by helping users manage their screen time and set healthy boundaries for website usage.

## Features

### 🕒 **Screen Time Tracking**

- Real-time tracking of time spent on each website
- Daily statistics and usage insights
- Visual progress bars showing time limits

### ⏰ **Per-Site Timers**

- Set custom time limits for specific websites
- Automatic notifications when limits are reached
- Warning notifications at 80% of time limit

### 🌟 **Digital Wellbeing Features**

- Global daily screen time limits
- Break reminders at customizable intervals
- Encouraging break suggestions and activities
- Pause/resume functionality for flexible usage

### 📊 **Statistics & Insights**

- Daily usage statistics
- Number of sites visited
- Break tracking
- Visual progress indicators

### 🎨 **User-Friendly Interface**

- Clean, modern design
- Responsive popup interface
- Keyboard shortcuts (Ctrl/Cmd + Shift + B for breaks)
- Dark mode support

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download the Extension**

   ```bash
   git clone <repository-url>
   cd digital-wellbeing-timer
   ```

2. **Open Chrome Extensions Page**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**

   - Click "Load unpacked"
   - Select the extension directory containing `manifest.json`
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Digital Wellbeing Timer" and click the pin icon

### Method 2: Install from Chrome Web Store (Coming Soon)

- Search for "Digital Wellbeing Timer" in the Chrome Web Store
- Click "Add to Chrome"

## Usage

### Getting Started

1. **Click the Extension Icon**

   - Click the Digital Wellbeing Timer icon in your Chrome toolbar
   - The popup will show your current site and usage statistics

2. **Configure Global Settings**

   - Set your daily screen time limit (default: 8 hours)
   - Configure break reminder intervals (default: 30 minutes)
   - Click "Save Settings" to apply changes

3. **Add Site-Specific Timers**
   - Enter a website URL (e.g., "youtube.com")
   - Set a time limit in minutes
   - Click "Add" to create the timer

### Features in Action

#### **Time Limit Notifications**

- When you reach 80% of a site's time limit, you'll see a warning
- At 100%, a full-screen overlay will appear encouraging you to take a break
- You can choose to take a break or continue for 5 more minutes

#### **Break Reminders**

- Receive notifications at your set intervals
- Click notifications to see break activity suggestions
- Track your break-taking habits

#### **Timer Controls**

- **Pause Timer**: Temporarily stop tracking (useful for work-related browsing)
- **Reset Timer**: Clear the current site's accumulated time
- **Statistics**: View your daily usage patterns

### Keyboard Shortcuts

- **Ctrl/Cmd + Shift + B**: Trigger a break suggestion overlay
- **Escape**: Dismiss any active overlays

## File Structure

```
digital-wellbeing-timer/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for page interactions
├── content.css           # Content script styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### **Manifest V3 Compliance**

- Uses the latest Chrome extension manifest format
- Service worker-based background script
- Modern permissions model

### **Data Storage**

- **Chrome Storage Sync**: Settings and preferences
- **Chrome Storage Local**: Site timers and usage data
- **Session Management**: Real-time tracking state

### **Privacy & Security**

- All data is stored locally on your device
- No external data transmission
- Minimal permissions required for functionality

## Customization

### **Adding Custom Icons**

Replace the placeholder icons in the `icons/` directory:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

### **Modifying Styles**

- Edit `popup.css` for popup interface styling
- Edit `content.css` for page overlay styling
- All styles support dark mode and accessibility features

### **Extending Functionality**

- Add new features by modifying the background script
- Customize notifications in `background.js`
- Enhance the popup interface in `popup.js`

## Troubleshooting

### **Extension Not Loading**

- Ensure all files are present in the directory
- Check that `manifest.json` is valid JSON
- Verify Chrome's developer mode is enabled

### **Timers Not Working**

- Check that the extension has necessary permissions
- Refresh the extension in `chrome://extensions/`
- Clear browser cache and reload

### **Notifications Not Appearing**

- Verify notification permissions in Chrome settings
- Check that the extension is not paused
- Ensure break reminders are properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests:

- Create an issue in the repository
- Check the troubleshooting section above
- Review the technical documentation

---

**Built with ❤️ for better digital wellbeing**
