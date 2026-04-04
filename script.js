const STORAGE_USERS = 'habitTracker_auth_users';
const STORAGE_SESSION = 'habitTracker_auth_session';
const LEGACY_HABITS_KEY = 'habits';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HABIT_CATEGORIES = [
    { id: 'fitness', label: 'Fitness' },
    { id: 'study', label: 'Study' },
    { id: 'faith', label: 'Faith' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'home', label: 'Home' },
    { id: 'work', label: 'Work' },
    { id: 'social', label: 'Social' },
    { id: 'general', label: 'General' }
];

const authView = document.getElementById('authView');
const appView = document.getElementById('appView');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const toggleAuth = document.getElementById('toggleAuth');
const authToggleText = document.getElementById('authToggleText');
const authError = document.getElementById('authError');
const logoutButton = document.getElementById('logoutButton');
const userGreeting = document.getElementById('userGreeting');

let habitInput;
let habitCategorySelect;
let addButton;
let habitsList;
let categoryFilterBar;
let calendarGrid;
let calMonthLabel;
let calPrev;
let calNext;
let calToday;
let selectedDayPanel;

let habits = [];
let isSignupMode = false;
let habitControlsWired = false;
let calendarWired = false;
let habitsListWired = false;

let calendarMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
let selectedDateKey = formatDateKey(new Date());
let categoryFilter = 'all';

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getSessionUserId() {
    return localStorage.getItem(STORAGE_SESSION);
}

function setSessionUserId(userId) {
    localStorage.setItem(STORAGE_SESSION, userId);
}

function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
}

function habitsStorageKey(userId) {
    return `habitTracker_habits_${userId}`;
}

function bufferToHex(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    return bufferToHex(bits);
}

async function signUp(email, password) {
    const normalized = email.toLowerCase().trim();
    const users = getUsers();
    if (users.some((u) => u.email === normalized)) {
        throw new Error('That email is already registered.');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt);
    const user = {
        id: crypto.randomUUID(),
        email: normalized,
        passwordHash,
        saltHex: bufferToHex(salt)
    };
    users.push(user);
    saveUsers(users);
    setSessionUserId(user.id);
    migrateLegacyHabitsIfAny(user.id);
    return user;
}

async function logIn(email, password) {
    const normalized = email.toLowerCase().trim();
    const users = getUsers();
    const user = users.find((u) => u.email === normalized);
    if (!user) {
        throw new Error('Invalid email or password.');
    }
    const salt = hexToBuffer(user.saltHex);
    const passwordHash = await hashPassword(password, salt);
    if (passwordHash !== user.passwordHash) {
        throw new Error('Invalid email or password.');
    }
    setSessionUserId(user.id);
    return user;
}

function logOut() {
    clearSession();
    habits = [];
    showAuthView();
    updateAuthModeUI();
}

function migrateLegacyHabitsIfAny(userId) {
    const legacy = localStorage.getItem(LEGACY_HABITS_KEY);
    if (!legacy) return;
    const key = habitsStorageKey(userId);
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, legacy);
    }
    localStorage.removeItem(LEGACY_HABITS_KEY);
}

function showAuthView() {
    authView.classList.remove('hidden');
    appView.classList.add('hidden');
}

function showAppView(user) {
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
    userGreeting.textContent = `Signed in as ${user.email}`;
}

function setAuthError(message) {
    if (!message) {
        authError.hidden = true;
        authError.textContent = '';
        return;
    }
    authError.hidden = false;
    authError.textContent = message;
}

function isValidEmail(email) {
    const s = String(email).trim();
    if (s.length === 0 || s.length > 254) return false;
    const at = s.indexOf('@');
    if (at <= 0 || at !== s.lastIndexOf('@')) return false;
    const local = s.slice(0, at);
    const domain = s.slice(at + 1);
    if (local.length > 64 || domain.length === 0 || domain.length > 253) return false;
    if (!domain.includes('.')) return false;
    const dot = domain.lastIndexOf('.');
    if (dot <= 0 || dot === domain.length - 1) return false;
    const tld = domain.slice(dot + 1);
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;
    const localOk = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local);
    const domainPart = domain.slice(0, dot);
    const domainOk =
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(
            domainPart + '.' + tld
        );
    return localOk && domainOk;
}

function updateAuthModeUI() {
    if (isSignupMode) {
        authTitle.textContent = 'Create account';
        authSubmit.textContent = 'Sign up';
        authToggleText.textContent = 'Already have an account?';
        toggleAuth.textContent = 'Log in';
        authPassword.setAttribute('autocomplete', 'new-password');
    } else {
        authTitle.textContent = 'Log in';
        authSubmit.textContent = 'Log in';
        authToggleText.textContent = 'Don’t have an account?';
        toggleAuth.textContent = 'Sign up';
        authPassword.setAttribute('autocomplete', 'current-password');
    }
}

toggleAuth.addEventListener('click', () => {
    isSignupMode = !isSignupMode;
    setAuthError('');
    updateAuthModeUI();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAuthError('');
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!isValidEmail(email)) {
        setAuthError('Please enter a valid email address.');
        return;
    }
    if (password.length < 8) {
        setAuthError('Password must be at least 8 characters.');
        return;
    }
    authSubmit.disabled = true;
    try {
        const user = isSignupMode ? await signUp(email, password) : await logIn(email, password);
        bindAppElements();
        wireHabitControls();
        wireCalendarControls();
        wireHabitsListDelegation();
        wireCategoryFilterBar();
        loadHabits();
        calendarMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
        selectedDateKey = todayKey();
        renderHabits();
        renderCalendar();
        renderSelectedDayPanel();
        showAppView(user);
        authPassword.value = '';
    } catch (err) {
        setAuthError(err.message || 'Something went wrong.');
    } finally {
        authSubmit.disabled = false;
    }
});

logoutButton.addEventListener('click', () => {
    logOut();
});

function bindAppElements() {
    habitInput = document.getElementById('habitInput');
    habitCategorySelect = document.getElementById('habitCategory');
    addButton = document.getElementById('addButton');
    habitsList = document.getElementById('habitsList');
    categoryFilterBar = document.getElementById('categoryFilterBar');
    fillAddCategorySelect();
    calendarGrid = document.getElementById('calendarGrid');
    calMonthLabel = document.getElementById('calMonthLabel');
    calPrev = document.getElementById('calPrev');
    calNext = document.getElementById('calNext');
    calToday = document.getElementById('calToday');
    selectedDayPanel = document.getElementById('selectedDayPanel');
}

function getCurrentUser() {
    const id = getSessionUserId();
    if (!id) return null;
    return getUsers().find((u) => u.id === id) || null;
}

function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseDateKey(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function todayKey() {
    return formatDateKey(new Date());
}

function normalizeHabit(h) {
    const rawCat = typeof h.category === 'string' ? h.category : 'general';
    const category = HABIT_CATEGORIES.some((c) => c.id === rawCat) ? rawCat : 'general';

    if (Array.isArray(h.completedDates)) {
        let scheduleDays = h.scheduleDays === undefined ? null : h.scheduleDays;
        if (Array.isArray(scheduleDays) && scheduleDays.length === 7) {
            scheduleDays = null;
        }
        return {
            id: h.id,
            name: h.name,
            category,
            scheduleDays,
            completedDates: [...new Set(h.completedDates.map(String))].sort()
        };
    }
    const completedDates = [];
    if (h.completed) {
        completedDates.push(todayKey());
    }
    return {
        id: h.id,
        name: h.name,
        category,
        scheduleDays: null,
        completedDates
    };
}

function migrateHabitsArray() {
    habits = habits.map(normalizeHabit);
}

function isScheduledOnDate(habit, date) {
    if (habit.scheduleDays === null || habit.scheduleDays === undefined) {
        return true;
    }
    return habit.scheduleDays.includes(date.getDay());
}

function isDayInSchedule(habit, dayIndex) {
    if (habit.scheduleDays === null || habit.scheduleDays === undefined) {
        return true;
    }
    return habit.scheduleDays.includes(dayIndex);
}

function habitsDoneOnDate(dateKey) {
    return habits.filter((h) => h.completedDates.includes(dateKey));
}

function getCategoryLabel(categoryId) {
    const c = HABIT_CATEGORIES.find((x) => x.id === categoryId);
    return c ? c.label : 'General';
}

function categoryOptionsHtml(selectedId) {
    const id = HABIT_CATEGORIES.some((c) => c.id === selectedId) ? selectedId : 'general';
    return HABIT_CATEGORIES.map(
        (c) => `<option value="${c.id}"${c.id === id ? ' selected' : ''}>${escapeHtml(c.label)}</option>`
    ).join('');
}

function getHabitsToDisplay() {
    if (categoryFilter === 'all') return habits;
    return habits.filter((h) => (h.category || 'general') === categoryFilter);
}

function renderCategoryFilterBar() {
    if (!categoryFilterBar) return;
    const items = [{ id: 'all', label: 'All' }, ...HABIT_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];
    categoryFilterBar.innerHTML = items
        .map(
            (b) =>
                `<button type="button" class="category-filter-btn${categoryFilter === b.id ? ' active' : ''}" data-filter="${b.id}">${escapeHtml(b.label)}</button>`
        )
        .join('');
}

function fillAddCategorySelect() {
    if (!habitCategorySelect) return;
    habitCategorySelect.innerHTML = HABIT_CATEGORIES.map(
        (c) => `<option value="${c.id}">${escapeHtml(c.label)}</option>`
    ).join('');
    habitCategorySelect.value = 'general';
}

function setHabitEveryDay(id) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    habit.scheduleDays = null;
    saveHabits();
    renderHabits();
    renderCalendar();
    renderSelectedDayPanel();
}

function toggleScheduleDay(habitId, day) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    let days;
    if (habit.scheduleDays === null || habit.scheduleDays === undefined) {
        days = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== day);
    } else {
        days = [...habit.scheduleDays];
        if (days.includes(day)) {
            if (days.length <= 1) return;
            days = days.filter((d) => d !== day);
        } else {
            days.push(day);
        }
        days.sort((a, b) => a - b);
    }
    habit.scheduleDays = days.length === 7 ? null : days;
    saveHabits();
    renderHabits();
    renderCalendar();
    renderSelectedDayPanel();
}

function addHabit() {
    const habitText = habitInput.value.trim();
    if (habitText === '') {
        alert('Please enter a habit name!');
        return;
    }
    const rawCat = habitCategorySelect ? habitCategorySelect.value : 'general';
    const category = HABIT_CATEGORIES.some((c) => c.id === rawCat) ? rawCat : 'general';
    const newHabit = {
        id: Date.now(),
        name: habitText,
        category,
        scheduleDays: null,
        completedDates: []
    };
    habits.push(newHabit);
    habitInput.value = '';
    renderHabits();
    renderCalendar();
    renderSelectedDayPanel();
    saveHabits();
}

function toggleHabit(id) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const today = new Date();
    if (!isScheduledOnDate(habit, today)) {
        return;
    }
    const key = todayKey();
    const idx = habit.completedDates.indexOf(key);
    if (idx >= 0) {
        habit.completedDates.splice(idx, 1);
    } else {
        habit.completedDates.push(key);
        habit.completedDates.sort();
    }
    renderHabits();
    renderCalendar();
    renderSelectedDayPanel();
    saveHabits();
}

function deleteHabit(id) {
    habits = habits.filter((h) => h.id !== id);
    renderHabits();
    renderCalendar();
    renderSelectedDayPanel();
    saveHabits();
}

function renderScheduleRow(habit) {
    const dayButtons = DAY_SHORT.map((label, day) => {
        const active = isDayInSchedule(habit, day);
        return `<button type="button" class="schedule-day-btn${active ? ' active' : ''}" data-habit-id="${habit.id}" data-day="${day}" aria-pressed="${active}">${label}</button>`;
    }).join('');
    return `
        <div class="habit-schedule">
            <span class="schedule-label">Repeat on</span>
            <div class="schedule-days">
                ${dayButtons}
                <button type="button" class="schedule-everyday-btn" data-habit-id="${habit.id}" data-action="everyday">Every day</button>
            </div>
        </div>
    `;
}

function renderHabits() {
    renderCategoryFilterBar();
    habitsList.innerHTML = '';
    if (habits.length === 0) {
        habitsList.innerHTML =
            '<p class="habits-empty">No habits yet. Pick a category and add one above!</p>';
        return;
    }
    const visible = getHabitsToDisplay();
    if (visible.length === 0) {
        habitsList.innerHTML =
            '<p class="habits-empty">No habits in this category. Try another filter or add a habit under this category.</p>';
        return;
    }
    const today = new Date();
    const tKey = todayKey();
    visible.forEach((habit) => {
        const scheduledToday = isScheduledOnDate(habit, today);
        const isDoneToday = habit.completedDates.includes(tKey);
        const isChecked = scheduledToday && isDoneToday;
        const card = document.createElement('div');
        card.className = 'habit-card';
        if (isChecked) {
            card.classList.add('completed');
        }
        const restNote = scheduledToday
            ? ''
            : '<span class="rest-day-note">Not scheduled today</span>';
        const cat = habit.category || 'general';
        card.innerHTML = `
            <div class="habit-row-main">
                <input
                    type="checkbox"
                    class="habit-checkbox"
                    ${isChecked ? 'checked' : ''}
                    ${scheduledToday ? '' : 'disabled'}
                    onchange="toggleHabit(${habit.id})"
                    aria-label="Done today: ${escapeHtml(habit.name)}"
                >
                <span class="habit-name">${escapeHtml(habit.name)}</span>
                <button class="delete-button" onclick="deleteHabit(${habit.id})">Delete</button>
            </div>
            <div class="habit-row-meta">
                <span class="category-badge category-badge--${cat}">${escapeHtml(getCategoryLabel(cat))}</span>
                <label class="sr-only" for="habit-cat-select-${habit.id}">Category</label>
                <select id="habit-cat-select-${habit.id}" class="habit-category-select" data-habit-id="${habit.id}">${categoryOptionsHtml(cat)}</select>
                ${restNote}
            </div>
            ${renderScheduleRow(habit)}
        `;
        habitsList.appendChild(card);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveHabits() {
    const userId = getSessionUserId();
    if (!userId) return;
    localStorage.setItem(habitsStorageKey(userId), JSON.stringify(habits));
}

function loadHabits() {
    const userId = getSessionUserId();
    if (!userId) {
        habits = [];
        return;
    }
    const saved = localStorage.getItem(habitsStorageKey(userId));
    if (!saved) {
        habits = [];
        return;
    }
    try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
            habits = [];
            return;
        }
        habits = parsed.filter((h) => h != null && typeof h === 'object');
        migrateHabitsArray();
    } catch {
        habits = [];
    }
}

function renderCalendar() {
    const { year, month } = calendarMonth;
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = first.toLocaleString('default', { month: 'long', year: 'numeric' });
    calMonthLabel.textContent = monthName;

    calendarGrid.innerHTML = '';
    const today = todayKey();

    for (let i = 0; i < startPad; i++) {
        const pad = document.createElement('div');
        pad.className = 'calendar-day cal-pad';
        pad.setAttribute('aria-hidden', 'true');
        calendarGrid.appendChild(pad);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d);
        const dateKey = formatDateKey(cellDate);
        const count = habitsDoneOnDate(dateKey).length;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'calendar-day';
        cell.dataset.dateKey = dateKey;
        if (dateKey === today) {
            cell.classList.add('cal-today');
        }
        if (dateKey === selectedDateKey) {
            cell.classList.add('cal-selected');
        }
        cell.setAttribute('aria-label', `${dateKey}, ${count} habit${count === 1 ? '' : 's'} completed`);
        cell.innerHTML = `<span class="cal-day-num">${d}</span><span class="cal-day-count">${count > 0 ? `${count} done` : '—'}</span>`;
        calendarGrid.appendChild(cell);
    }
}

function renderSelectedDayPanel() {
    if (!selectedDateKey) {
        selectedDayPanel.hidden = true;
        selectedDayPanel.innerHTML = '';
        return;
    }
    const done = habitsDoneOnDate(selectedDateKey);
    const pretty = parseDateKey(selectedDateKey).toLocaleDateString('default', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    selectedDayPanel.hidden = false;
    if (done.length === 0) {
        selectedDayPanel.innerHTML = `<strong>${escapeHtml(pretty)}</strong><p class="empty-day">No habits marked complete on this day.</p>`;
        return;
    }
    const items = done
        .map((h) => {
            const cat = h.category || 'general';
            return `<li><span class="category-badge category-badge--${cat} category-badge--small">${escapeHtml(getCategoryLabel(cat))}</span> ${escapeHtml(h.name)}</li>`;
        })
        .join('');
    selectedDayPanel.innerHTML = `<strong>${escapeHtml(pretty)}</strong><ul>${items}</ul>`;
}

window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;

function wireHabitControls() {
    if (habitControlsWired) return;
    habitControlsWired = true;
    addButton.addEventListener('click', addHabit);
    habitInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            addHabit();
        }
    });
}

function wireCalendarControls() {
    if (calendarWired) return;
    calendarWired = true;
    calPrev.addEventListener('click', () => {
        const d = new Date(calendarMonth.year, calendarMonth.month - 1, 1);
        calendarMonth = { year: d.getFullYear(), month: d.getMonth() };
        renderCalendar();
    });
    calNext.addEventListener('click', () => {
        const d = new Date(calendarMonth.year, calendarMonth.month + 1, 1);
        calendarMonth = { year: d.getFullYear(), month: d.getMonth() };
        renderCalendar();
    });
    calToday.addEventListener('click', () => {
        const n = new Date();
        calendarMonth = { year: n.getFullYear(), month: n.getMonth() };
        selectedDateKey = todayKey();
        renderCalendar();
        renderSelectedDayPanel();
    });
    calendarGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.calendar-day');
        if (!btn || btn.classList.contains('cal-pad') || !btn.dataset.dateKey) return;
        selectedDateKey = btn.dataset.dateKey;
        renderCalendar();
        renderSelectedDayPanel();
    });
}

let categoryFilterBarWired = false;
function wireCategoryFilterBar() {
    if (categoryFilterBarWired) return;
    categoryFilterBarWired = true;
    categoryFilterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-filter-btn');
        if (!btn || btn.dataset.filter === undefined) return;
        categoryFilter = btn.dataset.filter;
        renderHabits();
    });
}

function wireHabitsListDelegation() {
    if (habitsListWired) return;
    habitsListWired = true;
    habitsList.addEventListener('change', (e) => {
        const sel = e.target.closest('.habit-category-select');
        if (!sel) return;
        const id = Number(sel.dataset.habitId);
        const habit = habits.find((h) => h.id === id);
        if (!habit) return;
        const raw = sel.value;
        habit.category = HABIT_CATEGORIES.some((c) => c.id === raw) ? raw : 'general';
        saveHabits();
        renderHabits();
    });
    habitsList.addEventListener('click', (e) => {
        const everyday = e.target.closest('.schedule-everyday-btn');
        if (everyday && everyday.dataset.action === 'everyday') {
            const id = Number(everyday.dataset.habitId);
            if (!Number.isNaN(id)) setHabitEveryDay(id);
            return;
        }
        const dayBtn = e.target.closest('.schedule-day-btn');
        if (dayBtn && dayBtn.dataset.habitId != null && dayBtn.dataset.day != null) {
            const id = Number(dayBtn.dataset.habitId);
            const day = Number(dayBtn.dataset.day);
            if (!Number.isNaN(id) && !Number.isNaN(day)) {
                toggleScheduleDay(id, day);
            }
        }
    });
}

function initSession() {
    const user = getCurrentUser();
    if (user) {
        bindAppElements();
        wireHabitControls();
        wireCalendarControls();
        wireHabitsListDelegation();
        wireCategoryFilterBar();
        loadHabits();
        calendarMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
        selectedDateKey = todayKey();
        renderHabits();
        renderCalendar();
        renderSelectedDayPanel();
        showAppView(user);
    } else {
        clearSession();
        showAuthView();
        updateAuthModeUI();
    }
}

initSession();
