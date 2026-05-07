# 🟢 SpotCheck — Proactive Budget Alerts at the Door

> **Hackathon MVP** — A geofence-powered budgeting app that notifies you of your remaining budget the instant you walk into a store.

---

## 📸 What It Does

| Feature | Description |
|---|---|
| **Geofence Alerts** | Get a push notification with your budget balance when you enter a pinned store |
| **Daily Allowance** | Calculates `Remaining Budget ÷ Days Left in Month` so you know your safe spend |
| **Dark Fintech UI** | Sleek `#121212` dark mode with neon green `#00FF41` accents |
| **Live GPS** | Real-time coordinates with accuracy display |
| **Pin Stores** | One-tap store pinning with instant geofence registration |
| **5-min Cooldown** | Prevents notification spam from GPS drift |
| **Persistent Data** | Budgets and locations survive app restarts via AsyncStorage |

---

## 🗂 Project Structure

```
SpotCheck/
├── App.js                          # Entry point — permissions, notifications, provider
├── app.json                        # Expo config with background location + notifications
├── package.json                    # Dependencies
├── babel.config.js                 # Babel preset
├── assets/                         # App icons and splash screen
└── src/
    ├── context/
    │   └── BudgetContext.js         # React Context + AsyncStorage state management
    ├── services/
    │   └── locationService.js       # Geofence task definition + location API
    ├── screens/
    │   ├── Dashboard.js             # Budget cards, progress bars, manual spend
    │   └── MapScreen.js             # GPS display, store pinning, geofence sync
    └── navigation/
        └── AppNavigator.js          # Bottom tab navigator
```

---

## ⚙️ Prerequisites

1. **Node.js** (v18+ recommended) — [Install via nvm](https://github.com/nvm-sh/nvm)
2. **Expo CLI** — Installed automatically via `npx`
3. **Android Emulator** — via Android Studio, or a physical Android device
4. **Linux** — Tested on Ubuntu/Arch with Android Studio emulator

### Install Node.js (if not installed)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd SpotCheck
npm install
```

This single command installs everything:
- `expo` — Core framework
- `expo-location` — Foreground/background GPS + geofencing
- `expo-task-manager` — Background task execution
- `expo-notifications` — Push notifications
- `@react-native-async-storage/async-storage` — Persistent storage
- `@react-navigation/native` + `@react-navigation/bottom-tabs` — Navigation
- `react-native-screens` + `react-native-safe-area-context` — Navigation dependencies
- `expo-linear-gradient` — Gradient UI components

### 2. Start the Development Server

```bash
npx expo start
```

### 3. Run on Android Emulator

Press `a` in the terminal after the dev server starts, or:

```bash
npx expo start --android
```

### 4. Run on Physical Device

1. Install **Expo Go** from the Play Store
2. Scan the QR code shown in the terminal

---

## 📱 How to Demo

### Dashboard Screen
1. Open the app — you'll see 5 pre-populated budget categories
2. Tap **"− $10"** on any category to simulate spending
3. Watch the progress bar fill and the balance update in real-time
4. Note the **"Safe today"** allowance recalculates automatically
5. Tap **"↻ Reset Demo Data"** to restore original values

### Map & Geofence Screen
1. Switch to the **Map** tab
2. See your live GPS coordinates updating
3. Select a budget category (Coffee, Food, Tech, etc.)
4. Tap **"📍 Pin This Store"** — saves your current location with a geofence
5. The store appears in the "Saved Locations" list
6. Walk into a pinned store's geofence radius (100m) → instant budget notification!

### Testing Geofence Notifications

**On Android Emulator:**
1. Open Extended Controls (three dots on emulator sidebar)
2. Go to **Location** tab
3. Set coordinates near a pinned store
4. The notification should fire within seconds

**On Physical Device:**
1. Pin your current location as a store
2. Walk 100+ meters away
3. Walk back — notification triggers on re-entry

---

## 🔧 app.json Configuration Summary

| Setting | Purpose |
|---|---|
| `expo-location` plugin | Enables `isAndroidBackgroundLocationEnabled` and `isAndroidForegroundServiceEnabled` |
| `expo-notifications` plugin | Sets notification icon color to `#00FF41`, configures Android channel |
| `android.permissions` | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `POST_NOTIFICATIONS` |
| `userInterfaceStyle: "dark"` | System-level dark mode |
| `splash.backgroundColor` | `#121212` to match app theme |

---

## 🧠 Architecture

### Data Flow
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  BudgetContext   │────▶│   AsyncStorage   │◀────│  Geofence Task  │
│  (React State)   │     │  (Persistence)   │     │  (Background)   │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                              ┌─────────────────┐
│   Dashboard UI   │                              │  Notifications  │
│   MapScreen UI   │                              │  (expo-notif)   │
└─────────────────┘                              └─────────────────┘
```

### Key Design Decisions

- **TaskManager.defineTask at top-level**: The geofence task is defined at the module scope of `locationService.js` so it registers before any component mounts. This is **required** by Expo for background tasks.

- **AsyncStorage as bridge**: The background geofence task can't access React Context, so it reads budgets and locations directly from AsyncStorage. The context writes to AsyncStorage on every change, keeping them in sync.

- **5-minute cooldown**: GPS drift can cause repeated enter/exit events. The cooldown map (stored in AsyncStorage) prevents notification spam per region.

- **Daily Allowance formula**: `Remaining Budget / max(Days Left in Month, 1)` — the `max(..., 1)` prevents division by zero on the last day.

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| **"Location permission denied"** | Go to device Settings → Apps → SpotCheck → Permissions → Location → "Allow all the time" |
| **Notifications not showing** | Check Settings → Apps → SpotCheck → Notifications → Enable |
| **Geofence not triggering on emulator** | Use Extended Controls → Location to simulate GPS coordinates |
| **Background task not running** | Ensure `expo-task-manager` is installed and the task is defined at global scope |
| **"Task not registered" error** | Make sure `import './src/services/locationService'` is in `App.js` |
| **AsyncStorage errors** | Clear app data and restart: `npx expo start --clear` |

---

## 📦 Full Dependency Install Command

```bash
npx expo install expo-location expo-task-manager expo-notifications @react-native-async-storage/async-storage @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context expo-linear-gradient
```

> **Note:** Use `npx expo install` instead of `npm install` for Expo-managed packages to ensure version compatibility.

---

## 📄 License

Built for hackathon demonstration purposes. MIT License.

---

<p align="center">
  <b>SpotCheck</b> — Know your budget before you spend.<br/>
  <i>Built with Expo • React Native • Geofencing • 💚</i>
</p>
