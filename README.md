# The Habit Tracker

## About this project

**The Habit Tracker** is a small website for building routines: you sign in, add habits, check them off for today, and see your progress on a calendar. It is built with plain **HTML, CSS, and JavaScript**—no frameworks—and styled with a soft **dusty rose / blush** theme.

Each habit can sit in a **category** (like Fitness, Study, or Faith), you can **filter** the list by category, and set **which days of the week** a habit repeats. A **month calendar** shows how many habits you completed on each day; you can tap a date to see the list for that day.

**Accounts** are handled entirely in the browser: you register with email and password, passwords are hashed with **PBKDF2**, and your habits live in **localStorage** on your device—separate per account, not uploaded to a server.

The app is meant to be hosted like any **static site** (for example alongside this repo on GitHub). **Source / code:** [github.com/Ahlaam24/The-Habit-Tracker](https://github.com/Ahlaam24/The-Habit-Tracker)

## Features

### Accounts and authentication

- **Sign up** and **log in** with email and password (minimum 8 characters).
- Passwords are hashed in the browser with **PBKDF2** (not stored in plain text).
- Each account has **its own habits**—data is keyed by user in **localStorage** (stays on your device; not synced to a server).

### Habits

- **Add** habits with a **category** (Fitness, Study, Faith, Wellness, Home, Work, Social, General).
- **Filter** the list by category or show **All**.
- **Mark complete** for today and **delete** habits.
- **Repeat schedule**: choose **every day** or specific weekdays (Sun–Sat).
- **Calendar** month view: see how many habits you completed each day; tap a date for details.

### Design and accessibility

- **Dusty rose / blush** theme (CSS custom properties).
- **Visible labels** on the add-habit form (not placeholder-only).
- Client-side **email format validation** on sign up / log in.

### Data and reliability

- Habits and completions persist in **localStorage** (per browser, per account).
- **Corrupted** saved habit data is handled safely so the app still loads (empty list if parsing fails).

## How to use

1. **Sign up** with email and password, or **log in** if you already have an account.
2. Choose a **category**, enter a **habit**, click **Add Habit** (or press Enter in the habit field).
3. Use **category chips** to filter which habits you see.
4. Check the box when you complete a habit **today** (only on days it is scheduled, if you use a custom repeat).
5. Use **Schedule & calendar** below the list for repeats and history.
6. **Log out** when you are done on a shared computer.

## Technologies

- **HTML5**, **CSS3** (Flexbox, Grid), **JavaScript** (ES modules not required).
- **localStorage** for users, sessions, and habits.
- **Web Crypto API** (`crypto.subtle`) for password hashing.

## Browser support

Works in current **Chrome**, **Firefox**, **Safari**, and **Edge** when the site is served over **HTTPS** or **http://localhost** (not as a downloaded `file://` page).

## License

Open source for educational use.
