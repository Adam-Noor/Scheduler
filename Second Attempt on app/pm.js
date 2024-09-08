document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded. Initializing table...');

    initializePmTable(); // Initialize table structure

    // Check if an PM schedule exists, if not initialize an empty one
    const pmSchedule = JSON.parse(localStorage.getItem('pmSchedule')) || [];
    if (pmSchedule.length === 0) {
        console.log('Initializing empty PM schedule.');
        localStorage.setItem('pmSchedule', JSON.stringify([]));
    }

    loadPmSchedule();   // Load PM schedule from local storage
    loadPmBanks();        // Load therapist and client banks
    makeTableDroppable();
});


// Initialize PM schedule table
function initializePmTable() {
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
            <button class="action-button therapist" onclick="sendBackToBank(${i}, 'therapist')">↩ Therapist</button>
            <button class="action-button client" onclick="sendBackToBank(${i}, 'client')">↩ Client</button>
        `;
        actionCell.classList.add('action-cell');

        row.appendChild(therapistCell);
        row.appendChild(clientCell);
        row.appendChild(lockCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    }

    makeTableDroppable(); // Apply droppable functionality
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
                savePmSchedule();  // Save the new PM schedule state
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
                savePmSchedule();
            }
        });
    });
}


// Load PM schedule from local storage and ensure no AM pairs are duplicated
function loadPmSchedule() {
    const pmSchedule = JSON.parse(localStorage.getItem('pmSchedule')) || [];
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];
    const tableBody = document.getElementById('match-table').querySelector('tbody');

    // If no schedule exists, do nothing
    if (pmSchedule.length === 0) {
        console.log('No PM schedule found.');
        return;
    }

    tableBody.innerHTML = ''; // Clear previous rows before restoring

    // Populate PM schedule
    pmSchedule.forEach((pair, index) => {
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

        // Populate therapist and client from the saved schedule
        therapistCell.textContent = pair.therapist || ''; 
        clientCell.textContent = pair.client || '';

        row.appendChild(therapistCell);
        row.appendChild(clientCell);
        row.appendChild(lockCell);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });

    makeTableDroppable(); // Re-apply the droppable functionality
}


// Randomize PM schedule
function randomizePmSchedule() {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const unlockedTherapists = [];
    const unlockedClients = [];
    const assignedPairs = new Set(); // Track already assigned therapist-client pairs

    // Get the AM schedule to exclude pairs
    const amSchedule = JSON.parse(localStorage.getItem('amSchedule')) || [];

    // Get therapists and clients from the PM bank
    const therapistBank = document.querySelectorAll('#therapist-bank li');
    const clientBank = document.querySelectorAll('#client-bank li');

    console.log('Randomization started for PM schedule');

    // Collect unlocked therapists and clients from the grid
    rows.forEach((row, index) => {
        const therapist = row.children[0]?.textContent.trim();
        const client = row.children[1]?.textContent.trim();
        const isLocked = row.children[2]?.children[0]?.textContent === '🔒';

        if (!isLocked) {
            // Add therapists and clients from the grid to the unlocked lists if present
            if (therapist) unlockedTherapists.push(therapist);
            if (client) unlockedClients.push(client);

            // Clear unlocked rows to prepare for randomization
            row.children[0].textContent = ''; // Therapist
            row.children[1].textContent = ''; // Client
        }
    });

    // Add therapists and clients from the bank to the unlocked lists
    therapistBank.forEach(item => {
        if (item.textContent) {
            unlockedTherapists.push(item.textContent);
            item.remove(); // Remove them from the bank after adding to the list
        }
    });

    clientBank.forEach(item => {
        if (item.textContent) {
            unlockedClients.push(item.textContent);
            item.remove(); // Remove them from the bank after adding to the list
        }
    });

    // Make sure we have therapists and clients to randomize
    if (unlockedTherapists.length === 0 || unlockedClients.length === 0) {
        console.log('No unlocked therapists or clients found for PM.');
        return;
    }

    // Shuffle the therapists and clients
    const shuffledTherapists = shuffleArray(unlockedTherapists);
    const shuffledClients = shuffleArray(unlockedClients);

    let attempts = 0; // Safeguard to prevent infinite loops
    const maxAttempts = 100; // Limit the number of randomization attempts

    // Repopulate the grid with shuffled therapists and clients, excluding AM pairs and preventing repeats
    rows.forEach(row => {
        const isLocked = row.children[2]?.children[0]?.textContent === '🔒';
        if (!isLocked) {
            let therapist = shuffledTherapists.pop();
            let client = shuffledClients.pop();

            // Check if we ran out of therapists or clients
            if (!therapist || !client) {
                console.log('Ran out of therapists or clients.');
                return; // Exit early if we don't have enough items
            }

            // Try to find a valid pair within the maxAttempts limit
            let validPairFound = false;
            for (let i = 0; i < maxAttempts; i++) {
                const pairKey = `${therapist}-${client}`;
                if (
                    !amSchedule.some(pair => pair.therapist === therapist && pair.client === client) && // Avoid AM repeats
                    !assignedPairs.has(pairKey) // Avoid duplicates in the PM schedule
                ) {
                    validPairFound = true; // A valid pair is found
                    assignedPairs.add(pairKey); // Mark this pair as assigned
                    break;
                }

                // Reshuffle if the pair is in the AM schedule or already assigned
                shuffledTherapists.unshift(therapist);
                shuffledClients.unshift(client);

                therapist = shuffledTherapists.pop();
                client = shuffledClients.pop();

                // Check if we ran out of items to pop
                if (!therapist || !client) {
                    console.log('Ran out of therapists or clients during reshuffle.');
                    break; // Exit if we don't have enough items
                }

                attempts++;
            }

            if (!validPairFound) {
                console.log('Unable to find a valid therapist-client pair after maximum attempts.');
                // Add therapist and client back to the bank if no valid pair was found
                if (therapist) addBackToBank(therapist, 'therapist');
                if (client) addBackToBank(client, 'client');
            } else {
                // Assign the therapist and client to the grid
                row.children[0].textContent = therapist;
                row.children[1].textContent = client;
            }
        }
    });

    savePmSchedule(); // Save the new state after randomization
    console.log('Randomization completed for PM schedule');
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

        savePmSchedule(); // Save the updated schedule
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
        savePmSchedule(); // Save the updated schedule
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


function savePmSchedule() {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const pmSchedule = Array.from(rows).map(row => {
        return {
            therapist: row.children[0].textContent,
            client: row.children[1].textContent,
            locked: row.children[2].children[0].textContent === '🔒'
        };
    });
    localStorage.setItem('pmSchedule', JSON.stringify(pmSchedule));

    // Save the updated PM banks
    savePmBanks();
}



function loadPmBanks() {
    // Retrieve therapists and clients for PM from local storage
    const therapists = JSON.parse(localStorage.getItem('therapists')) || [];
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    
    // We'll keep separate local storage keys for PM so that therapists/clients in AM are still available
    const pmTherapists = JSON.parse(localStorage.getItem('pmTherapists')) || therapists.slice(); // Clone therapists list
    const pmClients = JSON.parse(localStorage.getItem('pmClients')) || clients.slice(); // Clone clients list

    const therapistBank = document.getElementById('therapist-bank');
    const clientBank = document.getElementById('client-bank');

    therapistBank.innerHTML = '';
    clientBank.innerHTML = '';

    // Populate the PM bank for therapists and clients
    pmTherapists.forEach(therapist => {
        appendToBank(therapistBank, therapist, 'therapist');
    });

    pmClients.forEach(client => {
        appendToBank(clientBank, client, 'client');
    });

    makeDraggable(); // Apply drag-and-drop functionality
}

// Save PM therapist and client lists separately to local storage
function savePmBanks() {
    const pmTherapists = Array.from(document.querySelectorAll('#therapist-bank li')).map(item => item.textContent);
    const pmClients = Array.from(document.querySelectorAll('#client-bank li')).map(item => item.textContent);

    localStorage.setItem('pmTherapists', JSON.stringify(pmTherapists));
    localStorage.setItem('pmClients', JSON.stringify(pmClients));
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
                savePmSchedule();
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
