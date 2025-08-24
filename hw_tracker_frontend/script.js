// Azure Function base URL - replace with your actual Azure Function URL
const API_BASE_URL = 'https://hwtracker-func-001-hpaddmbaasfxhyg0.uksouth-01.azurewebsites.net/api/homework/{id?}?';

// Check API connectivity and show status
async function checkApiConnectivity() {
    const statusElement = document.createElement('div');
    statusElement.className = 'api-status loading';
    statusElement.textContent = 'Checking API...';
    document.body.appendChild(statusElement);
    
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            statusElement.className = 'api-status connected';
            statusElement.textContent = 'API Connected';
            setTimeout(() => statusElement.remove(), 3000);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        statusElement.className = 'api-status disconnected';
        statusElement.textContent = 'API Disconnected';
        console.error('API connectivity check failed:', error);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    // Check API connectivity
    checkApiConnectivity();
    
    // Check which page we're on and initialize accordingly
    if (document.getElementById('addTaskForm')) {
        initializeDashboard();
    }
});

// Dashboard functionality
function initializeDashboard() {
    // Initialize task form
    const addTaskForm = document.getElementById('addTaskForm');
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewTask();
    });
    
    // Display existing tasks
    displayTasks();
}

// Fetch all homework tasks from Azure Function
async function fetchHomeworkTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tasks = await response.json();
        console.log('Fetched tasks from API:', tasks);
        return tasks;
    } catch (error) {
        console.error('Error fetching homework tasks:', error);
        showNotification('Failed to load homework tasks. Please try again.', 'error');
        return [];
    }
}

// Add new task via Azure Function
async function addNewTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('dueDate').value;
    
    if (!title || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newTask = {
        title: title,
        description: description,
        dueDate: dueDate,
        completed: false
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newTask)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Task added successfully:', result);
        
        // Show success message
        showNotification('Task added successfully!', 'success');
        
        // Clear form
        document.getElementById('addTaskForm').reset();
        
        // Refresh task display
        displayTasks();
        
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Failed to add task. Please try again.', 'error');
    }
}

// Display all tasks
async function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    
    // Show loading state
    tasksList.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic;">Loading tasks...</p>';
    
    try {
        const tasks = await fetchHomeworkTasks();
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic;">No tasks yet. Add your first homework assignment above!</p>';
            return;
        }
        
        // Sort tasks by due date
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        tasksList.innerHTML = sortedTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-due">Due: ${formatDate(task.dueDate)}</div>
                </div>
                <div class="task-actions">
                    ${!task.completed ? 
                        `<button class="btn btn-success" onclick="toggleTaskComplete('${task.id}')">Mark Complete</button>` :
                        `<button class="btn btn-secondary" onclick="toggleTaskComplete('${task.id}')">Mark Incomplete</button>`
                    }
                    <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        tasksList.innerHTML = '<p style="text-align: center; color: #e53e3e; font-style: italic;">Error loading tasks. Please refresh the page.</p>';
    }
}

// Toggle task completion status via Azure Function
async function toggleTaskComplete(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/homework/${taskId}/complete`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ completed: true })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Task completion toggled:', result);
        
        // Show notification
        const status = result.completed ? 'completed' : 'marked as incomplete';
        showNotification(`Task "${result.title}" ${status}!`, 'success');
        
        // Refresh display
        displayTasks();
        
    } catch (error) {
        console.error('Error toggling task completion:', error);
        showNotification('Failed to update task status. Please try again.', 'error');
    }
}

// Delete task (keeping this for now, but you might want to add a DELETE endpoint)
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // For now, we'll just refresh the display
        // In a real implementation, you'd call a DELETE endpoint
        showNotification('Delete functionality would call Azure Function DELETE endpoint', 'info');
        displayTasks();
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#48bb78'};
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Sign out function (integrated with Azure AD B2C)
async function signOut() {
    try {
        // Clear local storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userAccount');
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during sign out:', error);
        // Still redirect even if there's an error
        window.location.href = 'index.html';
    }
}

// Add some CSS for completed tasks
const completedTaskStyles = `
    .task-item.completed {
        opacity: 0.7;
        background: #f0fff4;
        border-left-color: #38a169;
    }
    
    .task-item.completed .task-title {
        text-decoration: line-through;
        color: #38a169;
    }
    
    .task-item.completed .task-due {
        color: #38a169;
    }
`;

// Inject completed task styles
const styleSheet = document.createElement('style');
styleSheet.textContent = completedTaskStyles;
document.head.appendChild(styleSheet); 