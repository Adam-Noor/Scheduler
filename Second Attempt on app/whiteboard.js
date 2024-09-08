document.addEventListener('DOMContentLoaded', () => {
    initializeTable();
    loadTableState();
    loadBanks();
});

function makeDraggable() {
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.textContent);
            e.dataTransfer.setData('type', draggable.classList.contains('therapist') ? 'therapist' : 'client');
        });
    });
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


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Randomize button handler
function randomizePairs() {
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
            if (therapist) {
                console.log(`Unlocked therapist at row ${index}:`, therapist);
                unlockedTherapists.push(therapist);
            }
            if (client) {
                console.log(`Unlocked client at row ${index}:`, client);
                unlockedClients.push(client);
            }

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

    console.log('Unlocked Therapists:', unlockedTherapists);
    console.log('Unlocked Clients:', unlockedClients);

    // Shuffle the therapists and clients
    const shuffledTherapists = shuffleArray(unlockedTherapists);
    const shuffledClients = shuffleArray(unlockedClients);

    console.log('Shuffled Therapists:', shuffledTherapists);
    console.log('Shuffled Clients:', shuffledClients);

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

    saveTableState(); // Save the new state after randomization

    console.log('Randomization completed');
}



function toggleLock(rowIndex) {
    const row = document.querySelectorAll('#match-table tbody tr')[rowIndex];
    const lockIcon = row.children[2].children[0];
    const therapist = row.children[0].textContent.trim();
    const client = row.children[1].textContent.trim();
    const actionButtons = row.children[3].querySelectorAll('button');

    if (therapist && client) {
        if (lockIcon.textContent === '🔒') {
            lockIcon.textContent = '🔓';
            actionButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled');
            });
        } else {
            lockIcon.textContent = '🔒';
            actionButtons.forEach(button => {
                button.disabled = true;
                button.classList.add('disabled');
            });
        }

        saveTableState();
    }
}


function sendBackToBank(rowIndex, type) {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const row = rows[rowIndex];
    const cell = type === 'therapist' ? row.children[0] : row.children[1];
    const name = cell.textContent;

    if (name) {
        addBackToBank(name, type);
        cell.textContent = ''; // Clear the cell
        saveTableState();
    }
}

function loadBanks() {
    // Retrieve therapist and client names from local storage
    const therapists = JSON.parse(localStorage.getItem('therapists')) || [];
    const clients = JSON.parse(localStorage.getItem('clients')) || [];
    const gridState = JSON.parse(localStorage.getItem('gridState')) || [];

    // Get references to the therapist and client bank elements
    const therapistBank = document.getElementById('therapist-bank');
    const clientBank = document.getElementById('client-bank');

    // Clear the current contents of the banks
    therapistBank.innerHTML = '';
    clientBank.innerHTML = '';

    // Get the list of therapists and clients already in the grid
    const therapistsInGrid = gridState.map(pair => pair.therapist).filter(name => name);
    const clientsInGrid = gridState.map(pair => pair.client).filter(name => name);

    // Add therapists to the bank if they are not in the grid
    therapists.forEach(therapist => {
        if (!therapistsInGrid.includes(therapist)) {
            appendToBank(therapistBank, therapist, 'therapist');
        }
    });

    // Add clients to the bank if they are not in the grid
    clients.forEach(client => {
        if (!clientsInGrid.includes(client)) {
            appendToBank(clientBank, client, 'client');
        }
    });

    // Make the bank items draggable
    makeDraggable();
}


function appendToBank(bank, name, type) {
    // Create a new list item for the therapist or client
    const listItem = document.createElement('li');
    listItem.textContent = name;
    listItem.classList.add('draggable', type);
    listItem.setAttribute('draggable', 'true');

    // Append the list item to the specified bank
    bank.appendChild(listItem);

    // Make the list item draggable
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
                saveTableState();
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
                saveTableState();
            }
        });
    });
}

function removeFromBank(type, name) {
    const items = document.querySelectorAll(`#${type}-bank li`);
    items.forEach(item => {
        if (item.textContent === name) {
            item.parentNode.removeChild(item);
        }
    });
}

function addBackToBank(name, type) {
    const bank = document.getElementById(`${type}-bank`);
    if (!Array.from(bank.children).some(item => item.textContent === name)) {
        appendToBank(bank, name, type);
    }
}

function clearCell(name, type) {
    const rows = document.querySelectorAll('#match-table tbody tr');
    rows.forEach(row => {
        const cell = row.children[type === 'therapist' ? 0 : 1];
        if (cell.textContent === name) {
            cell.textContent = '';
        }
    });
}

function saveTableState() {
    const rows = document.querySelectorAll('#match-table tbody tr');
    const gridState = Array.from(rows).map(row => {
        return {
            therapist: row.children[0].textContent,
            client: row.children[1].textContent,
            locked: row.children[2].children[0].textContent === '🔒'
        };
    });

    localStorage.setItem('gridState', JSON.stringify(gridState));
}
