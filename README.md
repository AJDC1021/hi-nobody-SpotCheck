# 🟢 SpotCheck — Proactive Budget Alerts at the Door

**SpotCheck** is a geofenced budgeting assistant that helps you stay on track by sending real-time alerts the moment you enter a store. Using background location tracking, the app automatically reminds you of your remaining budget exactly when you need it most, preventing impulsive overspending. With a clean dashboard and smart geofence triggers, SpotCheck ensures your financial goals are always top-of-mind wherever you shop.

---

## 📲 Download & Demo

### 🤖 Android APK
You can download and install the latest build directly to your Android device:

**[Download SpotCheck APK (via Expo EAS)](https://expo.dev/accounts/ajdc2021/projects/spotcheck/builds/0bde7e46-e0b7-4421-8560-cea56db237f4)**

> [!TIP]
> After downloading, you may need to "Allow installation from unknown sources" in your Android settings to install the APK.

---

## 📸 Core Features

| Feature | Description |
|---|---|
| **Landing Screen** | Beautiful, gradient-rich entry point with animated branding |
| **Geofence Alerts** | Push notifications with your budget balance when you enter a pinned store |
| **Daily Allowance** | Calculates `Remaining Budget ÷ Days Left in Month` for safe spending |
| **Dark Fintech UI** | Sleek `#121212` dark mode with vibrant Indigo and Emerald accents |
| **Pin Stores** | One-tap store pinning with instant background geofence registration |
| **Live GPS** | Real-time coordinates display for precision tracking |
| **Persistent Data** | Budgets and locations survive app restarts via local storage |

---

## 🛠 Tech Stack

- **Framework:** React Native (Expo)
- **Language:** JavaScript (ES6+)
- **Navigation:** React Navigation (Native Stack & Bottom Tabs)
- **Location & Geofencing:** Expo Location & Task Manager
- **Notifications:** Expo Notifications
- **Maps:** React Native Maps
- **Storage:** AsyncStorage
- **Build Pipeline:** EAS Build

---

## 📱 How to Demo

1. **Dashboard**: Open the app to see your budget categories. Tap the minus buttons to simulate spending and watch the "Safe today" allowance update.
2. **Pin a Store**: Go to the **Map** tab. Select a category (e.g., Coffee) and tap **"📍 Pin This Store"** to save your current location.
3. **Trigger Alert**: Walk 100+ meters away from the pinned location and then walk back. You will receive a push notification showing your remaining budget for that category!

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

---

## 📄 License

Built for hackathon demonstration purposes. MIT License.

---

<p align="center">
  <b>SpotCheck</b> — Know your budget before you spend.<br/>
  <i>Built with Expo • React Native • Geofencing • 💚</i>
</p>
