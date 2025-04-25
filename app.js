let currentPage = 0;
const pageSize = 10;

function updatePaginationButtons(totalLogs) {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const currentPageDisplay = document.getElementById('currentPage');

    prevButton.disabled = currentPage === 0;
    nextButton.disabled = (currentPage + 1) * pageSize >= totalLogs;

    currentPageDisplay.textContent = `Page ${currentPage + 1}`;
}

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        fetchLogs();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    fetchLogs();
});

document.getElementById('searchButton').addEventListener('click', () => {
    currentPage = 0; // Reset to the first page on a new search
    fetchLogs();
});

async function fetchLogs() {
    const params = new URLSearchParams();

    const index = document.getElementById('index').value;
    params.append('index', index || '');

    const level = document.getElementById('level').value;
    if (level) params.append('level', level);

    const serviceName = document.getElementById('serviceName').value;
    if (serviceName) params.append('serviceName', serviceName);

    const keyword = document.getElementById('keyword').value;
    if (keyword) params.append('keyword', keyword);

    const startDate = document.getElementById('startDate').value;
    if (startDate) params.append('startDate', startDate);

    const endDate = document.getElementById('endDate').value;
    if (endDate) params.append('endDate', endDate);

    params.append('page', currentPage);
    params.append('size', pageSize);

    try {
        const response = await fetch(`http://localhost:9231/search/search-with-highlight?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        populateTable(data.logs);
        updatePaginationButtons(data.totalLogs);
    } catch (error) {
        console.error('Error:', error);
    }
}

function populateTable(logs) {
    const tableBody = document.getElementById('logTable').querySelector('tbody');
    tableBody.innerHTML = '';

    logs.forEach(log => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${log.timestamp}</td>
            <td>${log.level}</td>
            <td>${log.serviceName}</td>
            <td>${log.message}</td>
            <td>${log.exception || ''}</td>
            <td>${log.hostName}</td>
            <td>${log.hostIp}</td>
            <td>
                <button class="view-raw-log">View Raw Log</button>
                <div class="raw-log" style="display: none; margin-top: 5px;">${log.rawLog}</div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners to the raw log buttons
    document.querySelectorAll('.view-raw-log').forEach(button => {
        button.addEventListener('click', (event) => {
            const rawLogDiv = event.target.nextElementSibling;
            if (rawLogDiv.style.display === 'none') {
                rawLogDiv.style.display = 'block';
                button.textContent = 'Hide Raw Log';
            } else {
                rawLogDiv.style.display = 'none';
                button.textContent = 'View Raw Log';
            }
        });
    });
}

// Adjust the searchBox to take less space
const searchBox = document.getElementById('searchBox');
if (searchBox) {
    searchBox.style.maxHeight = '150px'; // Limit the height
    searchBox.style.overflowY = 'auto'; // Add scroll for overflow content
    searchBox.style.marginBottom = '10px'; // Add some spacing below
}