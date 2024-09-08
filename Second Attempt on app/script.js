document.addEventListener('DOMContentLoaded', () => {
    loadNames('therapists', 'therapist-list');
    loadNames('clients', 'client-list');
});

function loadNames(key, listId) {
    const names = JSON.parse(localStorage.getItem(key)) || [];
    const listElement = document.getElementById(listId).getElementsByTagName('ul')[0];
    listElement.innerHTML = ''; // Clear list

    names.forEach(name => {
        const listItem = createListItem(name, key);
        listElement.appendChild(listItem);
    });
}

function submitTherapist() {
    const therapist = document.getElementById('therapist-input').value.trim();
    if (therapist === '') return;

    addName('therapists', therapist, 'therapist-list');
    document.getElementById('therapist-input').value = '';
}

function submitClient() {
    const client = document.getElementById('client-input').value.trim();
    if (client === '') return;

    addName('clients', client, 'client-list');
    document.getElementById('client-input').value = '';
}

function addName(key, name, listId) {
    const names = JSON.parse(localStorage.getItem(key)) || [];
    if (!names.includes(name)) {
        names.push(name);
        localStorage.setItem(key, JSON.stringify(names));
        
        const listItem = createListItem(name, key);
        const listElement = document.getElementById(listId).getElementsByTagName('ul')[0];
        listElement.appendChild(listItem);
    }
}

function createListItem(name, key) {
    const listItem = document.createElement('li');
    listItem.textContent = name;

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.innerHTML = '&times;';
    removeButton.onclick = () => removeName(key, name, listItem);

    listItem.appendChild(removeButton);
    return listItem;
}

function removeName(key, name, listItem) {
    const names = JSON.parse(localStorage.getItem(key)) || [];
    const updatedNames = names.filter(n => n !== name);
    localStorage.setItem(key, JSON.stringify(updatedNames));

    listItem.remove();
}
