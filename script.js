// Step 1: Get references to the HTML elements we need
// We'll use these variables to interact with the page
const habitInput = document.getElementById('habitInput');
const addButton = document.getElementById('addButton');
const habitsList = document.getElementById('habitsList');

// Step 2: Create an array to store our habits
// This is like a list that will hold all our habit objects
let habits = [];

// Step 3: Function to add a new habit
// This runs when the user clicks the "Add Habit" button
function addHabit() {
    // Get the text from the input field and remove extra spaces
    const habitText = habitInput.value.trim();
    
    // Check if the input is not empty
    if (habitText === '') {
        alert('Please enter a habit name!');
        return; // Stop here if input is empty
    }
    
    // Create a new habit object
    // Each habit has: id (unique number), name (the text), and completed (true/false)
    const newHabit = {
        id: Date.now(), // Use current timestamp as unique ID
        name: habitText,
        completed: false
    };
    
    // Add the new habit to our habits array
    habits.push(newHabit);
    
    // Clear the input field so user can type a new habit
    habitInput.value = '';
    
    // Update the display to show the new habit
    renderHabits();
    
    // Save to localStorage so habits persist when page refreshes
    saveHabits();
}

// Step 4: Function to toggle completion status
// This runs when user checks/unchecks a habit
function toggleHabit(id) {
    // Find the habit with matching id in our array
    const habit = habits.find(h => h.id === id);
    
    // If we found it, flip the completed status
    if (habit) {
        habit.completed = !habit.completed;
        
        // Update the display
        renderHabits();
        
        // Save to localStorage
        saveHabits();
    }
}

// Step 5: Function to delete a habit
// This runs when user clicks the delete button
function deleteHabit(id) {
    // Filter out the habit with matching id
    // This creates a new array without that habit
    habits = habits.filter(h => h.id !== id);
    
    // Update the display
    renderHabits();
    
    // Save to localStorage
    saveHabits();
}

// Step 6: Function to display all habits on the page
// This creates the HTML for each habit and adds it to the page
function renderHabits() {
    // Clear the current list
    habitsList.innerHTML = '';
    
    // If there are no habits, show a message
    if (habits.length === 0) {
        habitsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No habits yet. Add one above!</p>';
        return;
    }
    
    // Loop through each habit and create HTML for it
    habits.forEach(habit => {
        // Create a div element for this habit
        const habitElement = document.createElement('div');
        habitElement.className = 'habit-item';
        
        // If the habit is completed, add the 'completed' class for styling
        if (habit.completed) {
            habitElement.classList.add('completed');
        }
        
        // Create the HTML content for this habit
        // This includes: checkbox, habit name, and delete button
        habitElement.innerHTML = `
            <input 
                type="checkbox" 
                class="habit-checkbox" 
                ${habit.completed ? 'checked' : ''}
                onchange="toggleHabit(${habit.id})"
            >
            <span class="habit-name">${habit.name}</span>
            <button class="delete-button" onclick="deleteHabit(${habit.id})">Delete</button>
        `;
        
        // Add this habit element to the list
        habitsList.appendChild(habitElement);
    });
}

// Step 7: Function to save habits to browser's localStorage
// localStorage lets us store data that persists even after closing the browser
function saveHabits() {
    // Convert our habits array to a JSON string
    // JSON is a format for storing data
    const habitsJSON = JSON.stringify(habits);
    
    // Save it to localStorage with the key 'habits'
    localStorage.setItem('habits', habitsJSON);
}

// Step 8: Function to load habits from localStorage
// This runs when the page loads to restore previously saved habits
function loadHabits() {
    // Try to get saved habits from localStorage
    const savedHabits = localStorage.getItem('habits');
    
    // If we found saved habits, convert them back to an array
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    }
    
    // Display the loaded habits
    renderHabits();
}

// Step 9: Set up event listeners
// These make the buttons and inputs actually do something

// When user clicks "Add Habit" button, run addHabit function
addButton.addEventListener('click', addHabit);

// When user presses Enter in the input field, also run addHabit function
habitInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addHabit();
    }
});

// Step 10: Load saved habits when page first loads
loadHabits();

