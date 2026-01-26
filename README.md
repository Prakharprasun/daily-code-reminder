# Daily Code Reminder ⚡

A Chrome extension that **forces you** to practice LeetCode and Codeforces daily by opening the sites until you mark tasks as done.

## Features

- **Aggressive Reminders** - Opens LeetCode/Codeforces tabs every 30 minutes until done
- **Streak Tracking** - Track your coding streaks
- **Quiet Hours** - No reminders during sleep (11 PM - 7 AM)
- **One-Click Complete** - Mark tasks done in the popup
- **Dark Theme UI** - Modern, beautiful interface

## Installation

1. Download/clone this repository
2. Go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select `LeetCode_Reminder` folder
5. Pin the extension to your toolbar

## How It Works

1. Every 30 minutes (configurable), if tasks aren't done, **tabs open automatically**
2. Click the extension icon to mark tasks complete
3. Once marked done, no more reminders for the day
4. Tasks reset at midnight

## Settings

Right-click extension → Options:
- Enable/disable platforms
- Reminder frequency (15min - 2hrs)
- Quiet hours

## Files

```
LeetCode_Reminder/
├── manifest.json       # Extension config
├── background.js       # Alarm & tab opening logic
├── popup/              # Popup UI
├── options/            # Settings page
└── icons/              # Extension icons
```

## Privacy

All data stored locally. No external servers. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## License

MIT License
