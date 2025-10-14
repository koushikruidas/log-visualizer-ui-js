document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchButton = document.getElementById('searchButton');
    const logsTableBody = document.getElementById('logsTableBody');
    const totalHitsElements = document.querySelectorAll('#totalHits');
    const currentPageElements = document.querySelectorAll('#currentPage');
    const prevPageButtons = document.querySelectorAll('#prevPage');
    const nextPageButtons = document.querySelectorAll('#nextPage');
    const pageInputs = document.querySelectorAll('#pageInput');
    const totalPagesElements = document.querySelectorAll('#totalPages');
    const rawLogModal = document.getElementById('rawLogModal');
    const rawLogContent = document.getElementById('rawLogContent');
    const closeModal = document.querySelector('.close');
    const timeRangeSelect = document.getElementById('timeRange');
    const customDateRange = document.getElementById('customDateRange');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const pageSizeSelects = document.querySelectorAll('#pageSize');
    const bottomResultsInfo = document.getElementById('bottomResultsInfo');
    const indexInput = document.getElementById('index');

    // Ensure bottom results info is hidden on page load
    bottomResultsInfo.classList.add('hidden');

    // Clear error state when user types in index field
    indexInput.addEventListener('input', () => {
        if (indexInput.value.trim()) {
            indexInput.classList.remove('error');
            indexInput.placeholder = 'Enter index name';
        }
    });

    // State
    let currentPage = 0;
    let totalPages = 0;
    let pageSize = 10;

    // Event Listeners
    searchButton.addEventListener('click', performSearch);
    prevPageButtons.forEach(button => {
        button.addEventListener('click', () => changePage(currentPage - 1));
    });
    nextPageButtons.forEach(button => {
        button.addEventListener('click', () => changePage(currentPage + 1));
    });
    pageInputs.forEach(input => {
        input.addEventListener('change', handlePageInputChange);
    });
    closeModal.addEventListener('click', () => rawLogModal.style.display = 'none');
    timeRangeSelect.addEventListener('change', handleTimeRangeChange);
    pageSizeSelects.forEach(select => {
        select.addEventListener('change', handlePageSizeChange);
    });

    window.addEventListener('click', (event) => {
        if (event.target === rawLogModal) {
            rawLogModal.style.display = 'none';
        }
    });

    // Functions
    function handlePageSizeChange() {
        pageSize = parseInt(this.value);
        // Sync all page size selects
        pageSizeSelects.forEach(select => {
            if (select !== this) {
                select.value = pageSize;
            }
        });
        currentPage = 0; // Reset to first page when changing page size
        performSearch();
    }

    function handleTimeRangeChange() {
        const selectedRange = timeRangeSelect.value;
        if (selectedRange === 'custom') {
            customDateRange.style.display = 'grid';
        } else {
            customDateRange.style.display = 'none';
            updateDateTimeInputs(selectedRange);
        }
    }

    function updateDateTimeInputs(range) {
        const now = new Date();
        let startTime;

        switch (range) {
            case '15m':
                startTime = new Date(now.getTime() - 15 * 60 * 1000);
                break;
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '4h':
                startTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 15 * 60 * 1000); // Default to 15 minutes
        }

        startDateInput.value = startTime.toISOString().slice(0, 16);
        endDateInput.value = now.toISOString().slice(0, 16);
    }

    function showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    function getTimeRangeInMilliseconds(range) {
        switch (range) {
            case '15m':
                return 15 * 60 * 1000;
            case '1h':
                return 60 * 60 * 1000;
            case '4h':
                return 4 * 60 * 60 * 1000;
            case '24h':
                return 24 * 60 * 60 * 1000;
            default:
                return 15 * 60 * 1000; // Default to 15 minutes
        }
    }

    async function performSearch() {
        const index = document.getElementById('index').value;
        const indexInput = document.getElementById('index');
        const indexError = document.getElementById('indexError');

        if (!index) {
            // Force reflow to restart animation
            indexInput.style.animation = 'none';
            indexInput.offsetHeight; // Trigger reflow
            indexInput.style.animation = null;
            
            indexInput.classList.add('error');
            indexInput.placeholder = 'Index cannot be empty';
            return;
        }

        // Clear error state if index is valid
        indexInput.classList.remove('error');
        indexInput.placeholder = 'Enter index name';

        const params = new URLSearchParams();
        params.append('index', index);

        // Add optional parameters if they have values
        const level = document.getElementById('level').value;
        const serviceName = document.getElementById('serviceName').value;
        const keyword = document.getElementById('keyword').value;
        const pageSize = document.getElementById('pageSize').value;
        const currentPage = parseInt(document.getElementById('currentPage').textContent.split(' ')[1]);
        const from = (currentPage - 1) * pageSize;

        if (level) params.append('level', level);
        if (serviceName) params.append('serviceName', serviceName);
        if (keyword) params.append('keyword', keyword);
        if (from) params.append('from', from);
        if (pageSize) params.append('size', pageSize);

        // Handle date range
        const timeRange = document.getElementById('timeRange').value;
        let startDate, endDate;
        if (timeRange === 'custom') {
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
        } else {
            const now = new Date();
            endDate = now.toISOString();
            startDate = new Date(now.getTime() - getTimeRangeInMilliseconds(timeRange)).toISOString();
        }
        params.append('startDate', startDate);
        params.append('endDate', endDate);

        showLoading();
        try {
            const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:8080';
            const headers = {};
            if (window.Auth && typeof window.Auth.getAuthHeader === 'function') {
                const authHeader = await window.Auth.getAuthHeader();
                if (authHeader) headers['Authorization'] = authHeader;
            }
            const response = await fetch(`${API_BASE_URL}/search/search-with-highlight?${params}`, { headers });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    if (window.Auth && typeof window.Auth.login === 'function') {
                        // attempt a silent refresh first
                        if (typeof window.Auth.getAccessToken === 'function') {
                            try {
                                await window.Auth.getAccessToken();
                            } catch (e) {}
                        }
                        // then force re-login
                        window.Auth.login();
                        return;
                    }
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            alert('Error fetching logs. Please try again.');
        } finally {
            hideLoading();
        }
    }

    function displayResults(data) {
        logsTableBody.innerHTML = '';
        totalHitsElements.forEach(element => {
            element.textContent = `${data.totalHits} results found`;
        });
        
        totalPages = Math.ceil(data.totalHits / pageSize);
        updatePagination();

        // Show/hide bottom results info based on whether there are records
        const bottomResultsInfo = document.getElementById('bottomResultsInfo');
        if (data.totalHits > 0) {
            bottomResultsInfo.classList.remove('hidden');
        } else {
            bottomResultsInfo.classList.add('hidden');
        }

        data.logs.forEach(log => {
            const row = document.createElement('tr');
            
            // Create cells
            const timestampCell = document.createElement('td');
            timestampCell.textContent = new Date(log.timestamp).toLocaleString();
            
            const levelCell = document.createElement('td');
            const levelBadge = document.createElement('span');
            levelBadge.className = `log-level ${log.level}`;
            levelBadge.textContent = log.level;
            levelCell.appendChild(levelBadge);
            
            const serviceCell = document.createElement('td');
            serviceCell.innerHTML = log.serviceName || '-';
            
            const messageCell = document.createElement('td');
            messageCell.innerHTML = log.message || '-';
            
            const hostCell = document.createElement('td');
            hostCell.innerHTML = log.hostName || log.hostIp || '-';

            const exceptionCell = document.createElement('td');
            exceptionCell.innerHTML = log.exception || '-';
            
            const actionsCell = document.createElement('td');
            const viewRawButton = document.createElement('button');
            viewRawButton.className = 'view-raw-button';
            viewRawButton.textContent = 'View Raw';
            viewRawButton.addEventListener('click', () => showRawLog(log.rawLog));
            actionsCell.appendChild(viewRawButton);

            // Append cells to row
            row.appendChild(timestampCell);
            row.appendChild(levelCell);
            row.appendChild(serviceCell);
            row.appendChild(messageCell);
            row.appendChild(hostCell);
            row.appendChild(exceptionCell);
            row.appendChild(actionsCell);

            // Append row to table
            logsTableBody.appendChild(row);
        });
    }

    function updatePagination() {
        currentPageElements.forEach(element => {
            element.textContent = `Page ${currentPage + 1}`;
        });
        pageInputs.forEach(input => {
            input.value = currentPage + 1;
        });
        totalPagesElements.forEach(element => {
            element.textContent = totalPages;
        });
        prevPageButtons.forEach(button => {
            button.disabled = currentPage === 0;
        });
        nextPageButtons.forEach(button => {
            button.disabled = currentPage >= totalPages - 1;
        });
    }

    function changePage(newPage) {
        if (newPage >= 0 && newPage < totalPages) {
            currentPage = newPage;
            performSearch();
        }
    }

    function showRawLog(rawLog) {
        rawLogContent.textContent = rawLog;
        rawLogModal.style.display = 'block';
    }

    function handlePageInputChange() {
        const newPage = parseInt(this.value) - 1; // Convert to 0-based index
        if (newPage >= 0 && newPage < totalPages) {
            changePage(newPage);
        } else {
            // Reset to current page if invalid
            pageInputs.forEach(input => {
                input.value = currentPage + 1;
            });
        }
    }

    // Initialize with default time range (15 minutes)
    updateDateTimeInputs('15m');
}); 