// Azure Function base URL - replace with your actual Azure Function URL
const API_BASE_URL = 'https://your-azure-function.azurewebsites.net/api';

// Check API connectivity and show status
async function checkApiConnectivity() {
    const statusElement = document.createElement('div');
    statusElement.className = 'api-status loading';
    statusElement.textContent = 'Checking API...';
    document.body.appendChild(statusElement);
    
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
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

// Initialize the tutor page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check API connectivity first
    checkApiConnectivity();
    
    initializeTutorPage();
});

// Initialize tutor page functionality
function initializeTutorPage() {
    const tutorTaskForm = document.getElementById('tutorTaskForm');
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dueDate').value = tomorrow.toISOString().split('T')[0];
    
    // Add form submit event listener
    tutorTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewHomeworkAssignment();
    });
    
    // Display recent assignments
    displayRecentAssignments();
}

// Fetch all homework tasks from Azure Function
async function fetchHomeworkTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
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

// Add new homework assignment via Azure Function
async function addNewHomeworkAssignment() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('dueDate').value;
    const subject = document.getElementById('subject').value;
    
    if (!title || !description || !dueDate || !subject) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create new homework assignment in the same format as dashboard
    const newAssignment = {
        title: title,
        description: description,
        dueDate: dueDate,
        subject: subject,
        completed: false,
        addedBy: 'Tutor',
        dateAdded: new Date().toISOString().split('T')[0]
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/homework`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAssignment)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Homework assignment added successfully:', result);
        
        // Show success message
        showNotification('Homework assignment added successfully!', 'success');
        
        // Clear form
        document.getElementById('tutorTaskForm').reset();
        
        // Reset due date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').value = tomorrow.toISOString().split('T')[0];
        
        // Refresh recent assignments display
        displayRecentAssignments();
        
    } catch (error) {
        console.error('Error adding homework assignment:', error);
        showNotification('Failed to add homework assignment. Please try again.', 'error');
    }
}

// Display recent assignments
async function displayRecentAssignments() {
    const recentTasksList = document.getElementById('recentTasksList');
    
    // Show loading state
    recentTasksList.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic;">Loading assignments...</p>';
    
    try {
        const tasks = await fetchHomeworkTasks();
        
        if (tasks.length === 0) {
            recentTasksList.innerHTML = '<p style="text-align: center; color: #6b7280; font-style: italic;">No assignments added yet. Create your first homework assignment above!</p>';
            return;
        }
        
        // Show only the 5 most recent assignments
        const recentTasks = tasks.slice(0, 5);
        
        recentTasksList.innerHTML = recentTasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-meta">
                        <span class="task-subject">${task.subject || 'No Subject'}</span>
                        <span class="task-due">Due: ${formatDate(task.dueDate)}</span>
                        ${task.addedBy ? `<span class="task-added-by">Added by: ${task.addedBy}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-secondary" onclick="viewAssignmentDetails('${task.id}')">View Details</button>
                    <button class="btn btn-danger" onclick="deleteAssignment('${task.id}')">Delete</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        recentTasksList.innerHTML = '<p style="text-align: center; color: #e53e3e; font-style: italic;">Error loading assignments. Please refresh the page.</p>';
    }
}

// View assignment details
async function viewAssignmentDetails(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/homework/${taskId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const task = await response.json();
        
        const details = `
Assignment Details:
- Title: ${task.title}
- Description: ${task.description}
- Subject: ${task.subject || 'Not specified'}
- Due Date: ${formatDate(task.dueDate)}
- Status: ${task.completed ? 'Completed' : 'Pending'}
- Added by: ${task.addedBy || 'Unknown'}
- Date Added: ${task.dateAdded || 'Unknown'}
        `;
        
        alert(details);
        
    } catch (error) {
        console.error('Error fetching assignment details:', error);
        showNotification('Failed to load assignment details. Please try again.', 'error');
    }
}

// Delete assignment (keeping this for now, but you might want to add a DELETE endpoint)
function deleteAssignment(taskId) {
    if (confirm('Are you sure you want to delete this homework assignment?')) {
        // For now, we'll just refresh the display
        // In a real implementation, you'd call a DELETE endpoint
        showNotification('Delete functionality would call Azure Function DELETE endpoint', 'info');
        displayRecentAssignments();
    }
}

// Format date for display (same function as in main script)
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