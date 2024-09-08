document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded. Initializing table...');

    initializeTable(); // Initialize table structure

    // Check if an AM schedule exists, if not initialize an empty one
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];
    if (amSchedule.length === 0) {
        console.log('Initializing empty AM schedule.');
        localStorage.setItem('amSchedule', JSON.stringify([]));
    }

    loadAmSchedule();   // Load AM schedule from local storage
    loadBanks();        // Load therapist and client banks
    makeTableDroppable();
});



function initializeTable() {
    const tableBody = document.getElementById('match-table').querySelector('tbody');
    tableBody.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const row = document.createElement('tr');
        const therapistCell = document.createElement('td');
        const clientCell = document.createElement('td');
        const lockCell = document.createElement('td');
        const actionCell = document.createElement('td');

        therapistCell.classList.add('droppable', 'therapist');
        clientCell.classList.add('droppable', 'client');
        lockCell.innerHTML = '<span class="lock-icon">🔓</span>';
        lockCell.classList.add('lock-cell');
        lockCell.addEventListener('click', () => toggleLock(i));

        actionCell.innerHTML = `
            <button class="action-button therapist" onclick="sendBackToBank('${i}', 'therapist')">↩ Therapist</button>
            <button class="action-button client" onclick="sendBackToBank('${i}', 'client')">↩ Client</button>
        `;
        actionCell.classList.add('action-cell');

        row.appendChild(therapistCell);
        row.appendChild(clientCell);
        row.appendChild(lockCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }

    makeTableDroppable();
}

function makeTableDroppable() {
    const droppables = document.querySelectorAll('.droppable');
    const banks = document.querySelectorAll('.bank ul');

    droppables.forEach(droppable => {
        droppable.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        droppable.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text');
            const type = e.dataTransfer.getData('type');
            if (e.target.classList.contains(type)) {
                if (e.target.textContent) {
                    addBackToBank(e.target.textContent, type);
                }
                e.target.textContent = data;
                removeFromBank(type, data);
                saveAmSchedule();  // Save the new AM schedule state
            }
        });
    });

    banks.forEach(bank => {
        bank.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        bank.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text');
            const type = e.dataTransfer.getData('type');
            if (bank.id.startsWith(type)) {
                addBackToBank(data, type);
                clearCell(data, type);
                saveAmSchedule();
            }
        });
    });
}


// Load AM schedule from local storage
function loadAmSchedule() {
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];
    const tableBody = document.getElementById('match-table').querySelector('tbody');

    // If no schedule exists, do nothing
    if (amSchedule.length === 0) {
        console.log('No AM schedule found in local storage.');
        return;
    }

    tableBody.innerHTML = ''; // Clear the table before restoring

    // Populate the table with saved pairs
    amSchedule.forEach((pair, index) => {
        const row = document.createElement('tr');

        const therapistCell = document.createElement('td');
        const clientCell = document.createElement('td');
        const lockCell = document.createElement('td');
        const actionCell = document.createElement('td');

        therapistCell.classList.add('droppable', 'therapist');
        clientCell.classList.add('droppable', 'client');
        lockCell.innerHTML = `<span class="lock-icon">${pair.locked ? '🔒' : '🔓'}</span>`;
        lockCell.classList.add('lock-cell');
        lockCell.addEventListener('click', () => toggleLock(index));

        actionCell.innerHTML = `
            <button class="action-button therapist" onclick="sendBackToBank(${index}, 'therapist')">↩ Therapist</button>
            <button class="action-button client" onclick="sendBackToBank(${index}, 'client')">↩ Client</button>
        `;
        actionCell.classList.add('action-cell');

        // Restore the therapist and client names
        therapistCell.textContent = pair.therapist || ''; 
        clientCell.textContent = pair.client || '';

        row.appendChild(therapistCell);
        row.appendChild(clientCell);
        row.appendChild(lockCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);

        // Disable action buttons if the pair is locked
        const actionButtons = actionCell.querySelectorAll('button');
        if (pair.locked) {
            actionButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled'); // Optionally add a "disabled" class for styling
            });
        }
    });

    makeTableDroppable(); // Reapply the droppable functionality
}





// Randomize AM schedule
function randomizeAmSchedule() {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const unlockedTherapists = [];
    const unlockedClients = [];

    // Get therapists and clients from the bank
    const therapistBank = document.querySelectorAll('#therapist-bank li');
    const clientBank = document.querySelectorAll('#client-bank li');

    console.log('Randomization started');

    // Collect unlocked therapists and clients from the grid
    rows.forEach((row, index) => {
        const therapist = row.children[0].textContent.trim();
        const client = row.children[1].textContent.trim();
        const isLocked = row.children[2].children[0].textContent === '🔒';

        if (!isLocked) {
            // Add therapists and clients from grid to unlocked lists if present
            if (therapist) unlockedTherapists.push(therapist);
            if (client) unlockedClients.push(client);

            // Clear unlocked rows to prepare for randomization
            row.children[0].textContent = ''; // Therapist
            row.children[1].textContent = ''; // Client
        }
    });

    // Add therapists and clients from the bank to the unlocked lists
    therapistBank.forEach(item => {
        unlockedTherapists.push(item.textContent);
        item.remove(); // Remove them from the bank after adding to the list
    });

    clientBank.forEach(item => {
        unlockedClients.push(item.textContent);
        item.remove(); // Remove them from the bank after adding to the list
    });

    if (unlockedTherapists.length === 0 && unlockedClients.length === 0) {
        console.log('No unlocked therapists or clients found.');
        return;
    }

    // Shuffle the therapists and clients
    const shuffledTherapists = shuffleArray(unlockedTherapists);
    const shuffledClients = shuffleArray(unlockedClients);

    // Repopulate the grid with shuffled therapists and clients
    rows.forEach(row => {
        const isLocked = row.children[2].children[0].textContent === '🔒';
        if (!isLocked) {
            if (shuffledTherapists.length) {
                row.children[0].textContent = shuffledTherapists.pop();
            }
            if (shuffledClients.length) {
                row.children[1].textContent = shuffledClients.pop();
            }
        }
    });

    saveAmSchedule(); // Save the new state after randomization
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Lock/Unlock therapist-client pairs
function toggleLock(rowIndex) {
    const row = document.querySelectorAll('#match-table tbody tr')[rowIndex];
    const lockIcon = row.children[2].children[0];
    const therapist = row.children[0].textContent.trim();
    const client = row.children[1].textContent.trim();
    const actionButtons = row.children[3].querySelectorAll('button');

    if (therapist && client) {
        if (lockIcon.textContent === '🔒') {
            lockIcon.textContent = '🔓'; // Unlock
            actionButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled');
            });
        } else {
            lockIcon.textContent = '🔒'; // Lock
            actionButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
        }

        saveAmSchedule(); // Save the updated schedule
    }
}

// Send therapist or client back to the bank
function sendBackToBank(rowIndex, type) {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const row = rows[rowIndex];
    const cell = type === 'therapist' ? row.children[0] : row.children[1];
    const name = cell.textContent;

    if (name) {
        addBackToBank(name, type);
        cell.textContent = ''; // Clear the cell
        saveAmSchedule(); // Save the updated schedule
    }
}

// Add therapist or client back to the bank
function addBackToBank(name, type) {
    const bank = document.getElementById(`${type}-bank`);
    if (!Array.from(bank.children).some(item => item.textContent === name)) {
        appendToBank(bank, name, type);
    }
}

function appendToBank(bank, name, type) {
    const listItem = document.createElement('li');
    listItem.textContent = name;
    listItem.classList.add(type); // Add therapist or client class
    listItem.setAttribute('draggable', 'true'); // Make the item draggable

    // Add the item to the specified bank (therapist or client bank)
    bank.appendChild(listItem);

    // Apply drag event listeners
    listItem.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', name); // Pass the name as data
        e.dataTransfer.setData('type', type); // Pass the type (therapist or client)
        console.log(`Dragging ${name} (${type})`);
    });

    makeDraggable(); // Re-enable drag-and-drop functionality
}


// Save the AM schedule to local storage
function saveAmSchedule() {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const amSchedule = Array.from(rows).map(row => {
        return {
            therapist: row.children[0].textContent,  // Save therapist name
            client: row.children[1].textContent,     // Save client name
            locked: row.children[2].children[0].textContent === '🔒' // Save locked state
        };
    });
    localStorage.setItem('amSchedule', JSON.stringify(amSchedule)); // Save the grid state
}


function loadBanks() {
    const therapists = JSON.parse(localStorage.getItem('therapists')) || [];
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];

    const therapistBank = document.getElementById('therapist-bank');
    const clientBank = document.getElementById('client-bank');

    therapistBank.innerHTML = '';
    clientBank.innerHTML = '';

    // Get therapists and clients already in the grid
    const therapistsInGrid = amSchedule.map(pair => pair.therapist).filter(name => name);
    const clientsInGrid = amSchedule.map(pair => pair.client).filter(name => name);

    // Only add therapists and clients to the bank if they are not in the grid
    therapists.forEach(therapist => {
        if (!therapistsInGrid.includes(therapist)) {
            appendToBank(therapistBank, therapist, 'therapist');
        }
    });

    clients.forEach(client => {
        if (!clientsInGrid.includes(client)) {
            appendToBank(clientBank, client, 'client');
        }
    });

    makeDraggable(); // Re-enable drag-and-drop functionality
}


function loadTableState() {
    const gridState = JSON.parse(localStorage.getItem('gridState')) || [];
    const rows = document.querySelectorAll('#match-table tbody tr');

    gridState.forEach((pair, index) => {
        if (index < rows.length) {
            const cells = rows[index].children;
            if (pair.therapist) {
                cells[0].textContent = pair.therapist;
            }
            if (pair.client) {
                cells[1].textContent = pair.client;
            }
            cells[2].children[0].textContent = pair.locked ? '🔒' : '🔓';

            const actionButtons = cells[3].querySelectorAll('button');
            if (pair.locked) {
                actionButtons.forEach(button => {
                    button.disabled = true;
                    button.classList.add('disabled');
                });
            } else {
                actionButtons.forEach(button => {
                    button.disabled = false;
                    button.classList.remove('disabled');
                });
            }
        }
    });

    makeTableDroppable();
}

// Make the table cells and bank items draggable
function makeDraggable() {
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.textContent);
            e.dataTransfer.setData('type', draggable.classList.contains('therapist') ? 'therapist' : 'client');
        });
    });

    const droppables = document.querySelectorAll('.droppable');
    droppables.forEach(droppable => {
        droppable.addEventListener('dragover', (e) => e.preventDefault());

        droppable.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text');
            const type = e.dataTransfer.getData('type');
            if (e.target.classList.contains(type)) {
                if (e.target.textContent) {
                    addBackToBank(e.target.textContent, type);
                }
                e.target.textContent = data;
                removeFromBank(type, data);
                saveAmSchedule();
            }
        });
    });
}

// Remove item from bank
function removeFromBank(type, name) {
    const items = document.querySelectorAll(`#${type}-bank li`);
    items.forEach(item => {
        if (item.textContent === name) {
            item.parentNode.removeChild(item);
        }
    });
}
