document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded. Initializing table...');

    initializeLunchTable(); // Initialize table structure

    // Check if an Lunch schedule exists, if not initialize an empty one
    const lunchSchedule = JSON.parse(localStorage.getItem('lunchSchedule')) || [];
    if (lunchSchedule.length === 0) {
        console.log('Initializing empty PM schedule.');
        localStorage.setItem('lunchSchedule', JSON.stringify([]));
    }

    loadLunchSchedule();   // Load PM schedule from local storage
    loadLunchBanks();        // Load therapist and client banks
    makeTableDroppable();
});


// Initialize PM schedule table
function initializeLunchTable() {
    const tableBody = document.getElementById('lunch-table').querySelector('tbody');
    tableBody.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const row = document.createElement('tr');

        const therapistCell1 = document.createElement('td');
        const clientCell1 = document.createElement('td');
        const therapistCell2 = document.createElement('td');
        const clientCell2 = document.createElement('td');
        const actionCell = document.createElement('td');

        therapistCell1.classList.add('droppable', 'therapist');
        clientCell1.classList.add('droppable', 'client');
        therapistCell2.classList.add('droppable', 'therapist');
        clientCell2.classList.add('droppable', 'client');

        actionCell.innerHTML = `
            <button class="action-button therapist1" onclick="sendBackToBank(${i}, 'therapist1')">↩ Therapist 1</button>
            <button class="action-button client1" onclick="sendBackToBank(${i}, 'client1')">↩ Client 1</button>
            <button class="action-button therapist2" onclick="sendBackToBank(${i}, 'therapist2')">↩ Therapist 2</button>
            <button class="action-button client2" onclick="sendBackToBank(${i}, 'client2')">↩ Client 2</button>
        `;
        actionCell.classList.add('action-cell');

        row.appendChild(therapistCell1);
        row.appendChild(clientCell1);
        row.appendChild(therapistCell2);
        row.appendChild(clientCell2);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }

    makeTableDroppable(); // Ensure drag-and-drop works for lunch
}

function saveLunchBanks() {
    const therapistBankItems = Array.from(document.querySelectorAll('#therapist-bank li')).map(item => item.textContent);
    const clientBankItems = Array.from(document.querySelectorAll('#client-bank li')).map(item => item.textContent);

    localStorage.setItem('lunchTherapists', JSON.stringify(therapistBankItems));
    localStorage.setItem('lunchClients', JSON.stringify(clientBankItems));
}


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

// Function to make table cells and bank items draggable
function makeTableDroppable() {
    const droppables = document.querySelectorAll('.droppable');
    const banks = document.querySelectorAll('.bank ul');

    // Make the grid cells droppable
    droppables.forEach(droppable => {
        droppable.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
        });

        droppable.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text');
            const type = e.dataTransfer.getData('type');

            // Ensure the droppable cell matches the item type (therapist or client)
            if (e.target.classList.contains(type)) {
                if (e.target.textContent) {
                    // If the cell is already populated, return the existing name to the bank
                    addBackToBank(e.target.textContent, type);
                }
                e.target.textContent = data; // Set the new therapist/client name in the grid cell
                removeFromBank(type, data);  // Remove the item from the bank
                saveLunchSchedule();         // Save the updated lunch schedule
            }
        });
    });

    // Make the bank items draggable
    banks.forEach(bank => {
        bank.querySelectorAll('li').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text', e.target.textContent);
                e.dataTransfer.setData('type', item.classList.contains('therapist') ? 'therapist' : 'client');
            });
        });
    });
}



// Load PM schedule from local storage and ensure no AM pairs are duplicated
function loadLunchSchedule() {
    const savedLunchSchedule = JSON.parse(localStorage.getItem('lunchSchedule')) || [];
    const tableBody = document.getElementById('lunch-table').querySelector('tbody');

    if (savedLunchSchedule.length === 0) {
        console.log('No lunch schedule found.');
        return;
    }

    savedLunchSchedule.forEach((row, index) => {
        const rowElement = tableBody.children[index];
        rowElement.children[0].textContent = row.therapist1;
        rowElement.children[1].textContent = row.client1;
        rowElement.children[2].textContent = row.therapist2;
        rowElement.children[3].textContent = row.client2;
    });
}


// Send therapist or client back to the bank
function sendBackToBank(rowIndex, type) {
    const rows = document.querySelectorAll('#lunch-table tbody tr');
    const row = rows[rowIndex];
    const cell = type.startsWith('therapist') ? row.children[type === 'therapist1' ? 0 : 2] : row.children[type === 'client1' ? 1 : 3];
    const name = cell.textContent;

    if (name) {
        addBackToBank(name, type.includes('therapist') ? 'therapist' : 'client');
        cell.textContent = ''; // Clear the cell
        saveLunchSchedule(); // Save the updated schedule
    }
}

// Save lunch schedule to local storage
function saveLunchSchedule() {
    const rows = document.querySelectorAll('#lunch-table tbody tr');
    const lunchSchedule = Array.from(rows).map(row => {
        return {
            therapist1: row.children[0].textContent,
            client1: row.children[1].textContent,
            therapist2: row.children[2].textContent,
            client2: row.children[3].textContent
        };
    });
    localStorage.setItem('lunchSchedule', JSON.stringify(lunchSchedule));
}


function randomizeLunchSchedule() {
    const rows = document.querySelectorAll('#lunch-table tbody tr');
    const unlockedPairs = [];

    // Retrieve AM and PM schedules
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];
    const pmSchedule = JSON.parse(localStorage.getItem('pmSchedule')) || [];

    console.log("Randomization started for lunch schedule...");

    // Clear previous contents and collect unlocked rows
    rows.forEach((row, index) => {
        const isLocked = row.children[4].children[0].textContent === '🔒'; // Check if locked

        if (!isLocked) {
            unlockedPairs.push({ rowIndex: index });
            row.children[0].textContent = ''; // Clear Therapist 1
            row.children[1].textContent = ''; // Clear Client 1
            row.children[2].textContent = ''; // Clear Therapist 2
            row.children[3].textContent = ''; // Clear Client 2
        }
    });

    console.log("Unlocked pairs found: ", unlockedPairs.length);

    // Map of clients and their AM/PM therapists
    const clientTherapistMap = new Map();

    amSchedule.forEach(pair => {
        if (!clientTherapistMap.has(pair.client)) {
            clientTherapistMap.set(pair.client, { amTherapist: pair.therapist, pmTherapist: null });
        }
    });

    pmSchedule.forEach(pair => {
        if (clientTherapistMap.has(pair.client)) {
            clientTherapistMap.get(pair.client).pmTherapist = pair.therapist;
        } else {
            clientTherapistMap.set(pair.client, { amTherapist: null, pmTherapist: pair.therapist });
        }
    });

    // Attempt to match clients with their AM and PM therapists for lunch
    unlockedPairs.forEach((pair, index) => {
        const row = rows[pair.rowIndex];

        // Try to find a client with both AM and PM therapists
        for (let [client, therapists] of clientTherapistMap.entries()) {
            if (therapists.amTherapist && therapists.pmTherapist) {
                row.children[0].textContent = therapists.amTherapist;
                row.children[1].textContent = client;
                row.children[2].textContent = therapists.pmTherapist;
                row.children[3].textContent = client;

                // Mark this pair as used
                clientTherapistMap.delete(client);
                console.log(`Assigned client ${client} with AM therapist ${therapists.amTherapist} and PM therapist ${therapists.pmTherapist}`);
                break;
            }
        }
    });

    // Handle leftover clients/therapists with randomization
    const remainingTherapists = [];
    const remainingClients = [];

    // Collect leftover therapists and clients
    clientTherapistMap.forEach((therapists, client) => {
        if (therapists.amTherapist) remainingTherapists.push(therapists.amTherapist);
        if (therapists.pmTherapist) remainingTherapists.push(therapists.pmTherapist);
        remainingClients.push(client);
    });

    // Shuffle the remaining therapists and clients
    const shuffledTherapists = shuffleArray(remainingTherapists);
    const shuffledClients = shuffleArray(remainingClients);

    console.log("Remaining therapists after prioritized pairing: ", shuffledTherapists);
    console.log("Remaining clients after prioritized pairing: ", shuffledClients);

    // Randomize remaining pairs into the grid
    unlockedPairs.forEach(pair => {
        const row = rows[pair.rowIndex];

        // Only assign if the row is still empty
        if (!row.children[0].textContent && !row.children[2].textContent) {
            const therapist1 = shuffledTherapists.pop();
            const therapist2 = shuffledTherapists.pop();
            const client = shuffledClients.pop();

            if (therapist1 && therapist2 && client) {
                row.children[0].textContent = therapist1;
                row.children[1].textContent = client;
                row.children[2].textContent = therapist2;
                row.children[3].textContent = client;
                console.log(`Randomized client ${client} with therapists ${therapist1} and ${therapist2}`);
            }
        }
    });

    saveLunchSchedule(); // Save the randomized schedule
    console.log('Randomization complete for lunch schedule');
}


// Utility function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Helper function to add back to the bank
function addBackToBank(name, type) {
    const bank = document.getElementById(`${type}-bank`);
    const listItem = document.createElement('li');
    listItem.textContent = name;
    listItem.classList.add('draggable', type);
    listItem.setAttribute('draggable', 'true');
    bank.appendChild(listItem);

    makeDraggable(); // Reapply drag-and-drop functionality
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
    const row = document.querySelectorAll('#lunch-table tbody tr')[rowIndex];
    const lockIcon = row.children[4].children[0];
    
    const therapist1 = row.children[0].textContent.trim();
    const client1 = row.children[1].textContent.trim();
    const therapist2 = row.children[2].textContent.trim();
    const client2 = row.children[3].textContent.trim();
    
    if (therapist1 && client1 && therapist2 && client2) {
        if (lockIcon.textContent === '🔒') {
            lockIcon.textContent = '🔓'; // Unlock the pair
        } else {
            lockIcon.textContent = '🔒'; // Lock the pair
        }
        saveLunchSchedule(); // Save the lock state
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
        saveLunchSchedule(); // Save the updated schedule
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


function saveLunchSchedule() {
    const rows = document.querySelectorAll('#lunch-table tbody tr');
    const lunchSchedule = Array.from(rows).map(row => {
        return {
            therapist1: row.children[0].textContent,
            client1: row.children[1].textContent,
            therapist2: row.children[2].textContent,
            client2: row.children[3].textContent
        };
    });

    console.log("Saving lunch schedule to localStorage: ", lunchSchedule);
    localStorage.setItem('lunchSchedule', JSON.stringify(lunchSchedule));
}





// Load therapists and clients into the lunch bank from local storage
function loadLunchBanks() {
    const therapists = JSON.parse(localStorage.getItem('therapists')) || [];
    const clients = JSON.parse(localStorage.getItem('clients')) || [];

    const therapistBank = document.getElementById('therapist-bank');
    const clientBank = document.getElementById('client-bank');

    therapistBank.innerHTML = '';
    clientBank.innerHTML = '';

    therapists.forEach(therapist => appendToBank(therapistBank, therapist, 'therapist'));
    clients.forEach(client => appendToBank(clientBank, client, 'client'));

    makeDraggable(); // Apply draggable functionality
}

// Append therapist or client to the bank
function appendToBank(bank, name, type) {
    const listItem = document.createElement('li');
    listItem.textContent = name;
    listItem.classList.add(type);
    listItem.setAttribute('draggable', 'true');
    bank.appendChild(listItem);

    makeDraggable();
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
                saveLunchSchedule();
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
