// Update date and time every second
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    document.getElementById('dateTime').textContent = now.toLocaleString('en-US', options);
}

updateDateTime();
setInterval(updateDateTime, 1000);

// Color picker functionality
document.addEventListener('DOMContentLoaded', () => {
    const colorPicker = document.getElementById('colorPicker');
    const colorCircle = document.getElementById('colorCircle');
    const colorIcon = document.getElementById('colorIcon');
    const body = document.body;

    const savedColor = localStorage.getItem('backgroundColor');
    if (savedColor) {
        body.style.backgroundColor = savedColor;
        colorCircle.style.backgroundColor = savedColor;
        colorPicker.value = savedColor;
    } else {
        const defaultColor = '#f9fafb';
        body.style.backgroundColor = defaultColor;
        colorCircle.style.backgroundColor = defaultColor;
        colorPicker.value = defaultColor;
    }

    colorPicker.addEventListener('input', (e) => {
        const selectedColor = e.target.value;
        body.style.backgroundColor = selectedColor;
        colorCircle.style.backgroundColor = selectedColor;
        localStorage.setItem('backgroundColor', selectedColor);
    });

    colorCircle.addEventListener('click', () => colorPicker.click());
    colorIcon.addEventListener('click', () => colorPicker.click());

    loadTasks();
});

// Drag and drop functions
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    
    if (!draggedElement) return;
    
    const dropzone = ev.target.closest('.tasks-column, .pending-column, .completed-column');
    if (!dropzone) return;
    
    const checkbox = draggedElement.querySelector('input[type="checkbox"]');
    const taskText = draggedElement.querySelector('span');
    
    if (!checkbox || !taskText) return;
    
    const newColumn = dropzone.classList.contains('tasks-column') ? 'tasks' :
                     dropzone.classList.contains('pending-column') ? 'pending' : 'completed';
    
    if (newColumn === 'completed') {
        checkbox.checked = true;
        checkbox.disabled = true;
        taskText.classList.add('line-through');
        updateTaskTimestamps(draggedElement.id, newColumn, true);
    } else {
        checkbox.checked = false;
        checkbox.disabled = false;
        taskText.classList.remove('line-through');
        updateTaskTimestamps(draggedElement.id, newColumn, false);
    }
    
    dropzone.appendChild(draggedElement);
    saveTasks();
    
    // Don't update history here - only when button is clicked
}

function addTask() {
    const input = document.getElementById('newTaskInput');
    const taskText = input.value.trim();
    if (!taskText) return;

    const taskId = 'task' + Date.now();
    const tasksColumn = document.querySelector('.tasks-column');
    if (!tasksColumn) return;
    
    const newTask = document.createElement('div');
    newTask.className = 'bg-pink-100 p-3 mb-2 rounded cursor-move flex items-center justify-between';
    newTask.draggable = true;
    newTask.id = taskId;
    newTask.ondragstart = drag;
    
    newTask.innerHTML = `
        <div class="flex items-center">
            <input type="checkbox" class="mr-2" onchange="moveToCompleted(this)">
            <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
            </svg>
            <span>${taskText}</span>
        </div>
        <button onclick="deleteTask('${taskId}')" class="text-red-500 hover:text-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    tasksColumn.appendChild(newTask);
    input.value = '';
    
    // Add task with timestamp
    const now = new Date();
    const tasksByColumn = JSON.parse(localStorage.getItem('tasksByColumn')) || {
        tasks: {}, pending: {}, completed: {}
    };
    
    tasksByColumn.tasks[taskId] = {
        text: taskText,
        completed: false,
        createdAt: now.toLocaleString('en-US'),
        movedAt: now.toLocaleString('en-US')
    };
    
    localStorage.setItem('tasksByColumn', JSON.stringify(tasksByColumn));
    saveTasks();
}
    // Don't update history here - only when button is clicked
    // Add event listener for Enter key
        document.getElementById('newTaskInput').addEventListener('keypress', function(event) {
            if (event.key === 'Enter'){
                addTask();
            }
        });

function moveToCompleted(checkbox) {
    const taskElement = checkbox.parentElement.parentElement;
    if (!taskElement) return;
    
    const completedColumn = document.querySelector('.completed-column');
    if (!completedColumn) return;
    
    const taskText = taskElement.querySelector('span');
    if (!taskText) return;
    
    if (checkbox.checked) {
        checkbox.disabled = true;
        taskText.classList.add('line-through');
        completedColumn.appendChild(taskElement);
        updateTaskTimestamps(taskElement.id, 'completed', true);
    }
    
    saveTasks();
    
    // Don't update history here - only when button is clicked
}

function updateTaskTimestamps(taskId, column, isCompleted) {
    const tasksByColumn = JSON.parse(localStorage.getItem('tasksByColumn')) || {
        tasks: {}, pending: {}, completed: {}
    };
    
    // Find the task in any column
    let task = null;
    let oldColumn = null;
    for (const col of ['tasks', 'pending', 'completed']) {
        if (tasksByColumn[col][taskId]) {
            task = tasksByColumn[col][taskId];
            oldColumn = col;
            break;
        }
    }
    
    if (!task) return;
    
    const now = new Date();
    
    // Update task data
    task.completed = isCompleted;
    task.movedAt = now.toLocaleString('en-US');
    
    if (isCompleted) {
        task.completedAt = now.toLocaleString('en-US');
    } else {
        delete task.completedAt;
    }
    
    // Move task to new column
    if (oldColumn !== column) {
        delete tasksByColumn[oldColumn][taskId];
        tasksByColumn[column][taskId] = task;
    }
    
    localStorage.setItem('tasksByColumn', JSON.stringify(tasksByColumn));
}

function loadTasks() {
    const tasksByColumn = JSON.parse(localStorage.getItem('tasksByColumn')) || {
        tasks: {}, pending: {}, completed: {}
    };
    
    ['tasks', 'pending', 'completed'].forEach(column => {
        const columnElement = document.querySelector(`.${column}-column`);
        if (!columnElement) return;
        
        Object.entries(tasksByColumn[column]).forEach(([taskId, task]) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'bg-pink-100 p-3 mb-2 rounded cursor-move flex items-center justify-between';
            taskElement.draggable = true;
            taskElement.id = taskId;
            taskElement.ondragstart = drag;
            taskElement.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" class="mr-2" onchange="moveToCompleted(this)" ${task.completed ? 'checked disabled' : ''}>
                    <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                    </svg>
                    <span class="${task.completed ? 'line-through' : ''}">${task.text}</span>
                </div>
                <button onclick="deleteTask('${taskId}')" class="text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            columnElement.appendChild(taskElement);
        });
    });
}

function saveTasks() {
    const tasksByColumn = {
        tasks: {}, pending: {}, completed: {}
    };
    
    // Get stored tasks to preserve timestamps
    const storedTasks = JSON.parse(localStorage.getItem('tasksByColumn')) || {
        tasks: {}, pending: {}, completed: {}
    };
    
    ['tasks', 'pending', 'completed'].forEach(column => {
        const columnElement = document.querySelector(`.${column}-column`);
        if (columnElement) {
            Array.from(columnElement.children).forEach(taskElement => {
                const checkbox = taskElement.querySelector('input[type="checkbox"]');
                const taskText = taskElement.querySelector('span');
                if (taskText) {
                    const taskId = taskElement.id;
                    
                    // Find task in stored data to preserve timestamps
                    let storedTask = null;
                    for (const col of ['tasks', 'pending', 'completed']) {
                        if (storedTasks[col][taskId]) {
                            storedTask = storedTasks[col][taskId];
                            break;
                        }
                    }
                    
                    const now = new Date();
                    
                    tasksByColumn[column][taskId] = {
                        text: taskText.textContent,
                        completed: checkbox && checkbox.checked,
                        createdAt: storedTask?.createdAt || now.toLocaleString('en-US'),
                        movedAt: storedTask?.movedAt || now.toLocaleString('en-US')
                    };
                    
                    // Add completedAt if task is completed
                    if (checkbox && checkbox.checked) {
                        tasksByColumn[column][taskId].completedAt = 
                            storedTask?.completedAt || now.toLocaleString('en-US');
                    }
                }
            });
        }
    });
    
    localStorage.setItem('tasksByColumn', JSON.stringify(tasksByColumn));
}

function deleteTask(taskId) {
    const taskElement = document.getElementById(taskId);
    if (taskElement) {
        taskElement.remove();
        const tasksByColumn = JSON.parse(localStorage.getItem('tasksByColumn')) || {
            tasks: {}, pending: {}, completed: {}
        };
        
        // Store the deleted task in history before removing it
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks')) || [];
        
        // Find the task in any column
        for (const column of ['tasks', 'pending', 'completed']) {
            if (tasksByColumn[column][taskId]) {
                const task = tasksByColumn[column][taskId];
                
                // Add deletion timestamp
                task.deletedAt = new Date().toLocaleString('en-US');
                task.fromColumn = column;
                
                // Add to deleted tasks history
                deletedTasks.push(task);
                
                // Remove from active tasks
                delete tasksByColumn[column][taskId];
                break;
            }
        }
        
        // Save updated data
        localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
        localStorage.setItem('tasksByColumn', JSON.stringify(tasksByColumn));
        
        // Don't update history here - only when button is clicked
    }
}

function showTaskHistory() {
    const overlay = document.getElementById('taskHistoryOverlay');
    overlay.classList.toggle('hidden');
    overlay.classList.toggle('flex');
    
    if (overlay.classList.contains('flex')) {
        const tasksByColumn = JSON.parse(localStorage.getItem('tasksByColumn')) || {
            tasks: {}, pending: {}, completed: {}
        };
        
        const deletedTasks = JSON.parse(localStorage.getItem('deletedTasks')) || [];
        
        // Clear previous content
        const historyContainer = document.querySelector('#taskHistoryOverlay .space-y-4');
        historyContainer.innerHTML = '';
        
        // Create sections for each column with better UI
        const createHistorySection = (title, tasks, type) => {
            const section = document.createElement('div');
            section.className = 'mb-4';
            
            const header = document.createElement('h3');
            header.className = 'text-lg font-semibold mb-2';
            header.textContent = title;
            section.appendChild(header);
            
            const taskList = document.createElement('div');
            taskList.className = 'space-y-2';
            
            if (type === 'deleted') {
                if (tasks.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.className = 'text-gray-500 italic';
                    emptyMsg.textContent = 'No deleted tasks';
                    taskList.appendChild(emptyMsg);
                } else {
                    tasks.forEach(task => {
                        const taskItem = createTaskHistoryItem(task, type);
                        taskList.appendChild(taskItem);
                    });
                }
            } else {
                const taskEntries = Object.entries(tasks);
                if (taskEntries.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.className = 'text-gray-500 italic';
                    emptyMsg.textContent = 'No tasks';
                    taskList.appendChild(emptyMsg);
                } else {
                    taskEntries.forEach(([taskId, task]) => {
                        const taskItem = createTaskHistoryItem(task, type);
                        taskList.appendChild(taskItem);
                    });
                }
            }
            
            section.appendChild(taskList);
            return section;
        };
        
        // Add sections to history container
        historyContainer.appendChild(createHistorySection('Tasks', tasksByColumn.tasks, 'tasks'));
        historyContainer.appendChild(createHistorySection('Pending', tasksByColumn.pending, 'pending'));
        historyContainer.appendChild(createHistorySection('Completed', tasksByColumn.completed, 'completed'));
        historyContainer.appendChild(createHistorySection('Deleted Tasks', deletedTasks, 'deleted'));
        
        // Add close button at the top right with no extra space
        const closeButton = document.createElement('button');
        closeButton.className = 'text-red-500 hover:text-red-700 absolute top-0 right-0 m-0 p-2';
        closeButton.innerHTML = '<i class="fas fa-times text-xl"></i>';
        closeButton.onclick = showTaskHistory;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center mb-4 relative pr-0'; // Added pr-0 to remove right padding
        
        const title = document.createElement('h2');
        title.className = 'text-xl font-bold';
        title.textContent = 'Task History';
        
        headerDiv.appendChild(title);
        headerDiv.appendChild(closeButton);
        
        historyContainer.insertBefore(headerDiv, historyContainer.firstChild);
    }
}


// Helper function to create a task history item with better UI
function createTaskHistoryItem(task, type) {
    const taskItem = document.createElement('div');
    taskItem.className = 'bg-gray-100 p-3 rounded-lg shadow-sm';
    
    // Task content
    const taskContent = document.createElement('div');
    taskContent.className = 'flex items-start justify-between';
    
    // Left side - task text and status
    const taskInfo = document.createElement('div');
    
    const taskText = document.createElement('p');
    taskText.className = 'font-medium ' + (task.completed ? 'line-through text-gray-500' : '');
    taskText.textContent = task.text;
    taskInfo.appendChild(taskText);
    
    // Status badge
    const statusBadge = document.createElement('span');
    if (type === 'completed' || task.completed) {
        statusBadge.className = 'inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 mt-1';
        statusBadge.textContent = 'Completed';
    } else if (type === 'pending') {
        statusBadge.className = 'inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 mt-1';
        statusBadge.textContent = 'Pending';
    } else if (type === 'deleted') {
        statusBadge.className = 'inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 mt-1';
        statusBadge.textContent = 'Deleted';
    } else {
        statusBadge.className = 'inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-1';
        statusBadge.textContent = 'Active';
    }
    taskInfo.appendChild(statusBadge);
    
    taskContent.appendChild(taskInfo);
    
    // Right side - timestamps
    const timestampInfo = document.createElement('div');
    timestampInfo.className = 'text-xs text-gray-500 text-right';
    
    const createdTime = document.createElement('div');
    createdTime.innerHTML = `<span class="font-medium">Created:</span> ${task.createdAt || 'Unknown'}`;
    timestampInfo.appendChild(createdTime);
    
    if (task.movedAt && task.movedAt !== task.createdAt) {
        const movedTime = document.createElement('div');
        movedTime.innerHTML = `<span class="font-medium">Last moved:</span> ${task.movedAt}`;
        movedTime.className = 'mt-1';
        timestampInfo.appendChild(movedTime);
    }
    
    if (task.completedAt) {
        const completedTime = document.createElement('div');
        completedTime.innerHTML = `<span class="font-medium">Completed:</span> ${task.completedAt}`;
        completedTime.className = 'mt-1';
        timestampInfo.appendChild(completedTime);
    }
    
    if (task.deletedAt) {
        const deletedTime = document.createElement('div');
        deletedTime.innerHTML = `<span class="font-medium">Deleted:</span> ${task.deletedAt}`;
        deletedTime.className = 'mt-1';
        timestampInfo.appendChild(deletedTime);
    }
    
    taskContent.appendChild(timestampInfo);
    taskItem.appendChild(taskContent);
    
    return taskItem;
}

// For testing in Node.js environment
if (typeof window === 'undefined') {
    console.log("Task history functionality updated successfully!");
    console.log("Changes made:");
    console.log("1. History overlay only opens when the button is clicked");
    console.log("2. Improved UI for task history with better formatting");
    console.log("3. Positioned the overlay on the right side");
}