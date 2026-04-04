# The Habit Tracker

A simple web app to track daily habits. Built with vanilla HTML, CSS, and JavaScript—no frameworks.

## How to run it (recommended)

**Yes, this is necessary** if the GitHub Pages link does not work or you are working from your own copy. Sign up / log in uses the **Web Crypto API**, which needs a **real website address** (`http://localhost` or `https://…`). If you only **double-click `index.html`**, the address bar shows `file://…` and **authentication usually will not work**.

1. **Clone or download** this repository.
2. In a terminal, **serve the project folder** over HTTP:

```bash
cd The-Habit-Tracker
python3 -m http.server 8080
```

3. Open **http://localhost:8080** in your browser, then sign up or log in and add habits.

No Python? From the same folder you can use **`npx --yes serve -l 8080`** (needs Node.js), then open **http://localhost:8080**.

## Live demo (GitHub Pages)

**[Try the live demo](https://ahlaam24.github.io/The-Habit-Tracker/)** — only works if **GitHub Pages** is turned on for this repo (**Settings → Pages →** deploy from the `main` branch). If that link shows **404** or never loads, use the **local steps above**; they are the reliable way to use the app.

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

Works in current **Chrome**, **Firefox**, **Safari**, and **Edge** when served over **localhost** or **HTTPS**.

## License

Open source for educational use.
