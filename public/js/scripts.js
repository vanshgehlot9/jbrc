// Initialize Chart.js
document.addEventListener('DOMContentLoaded', function() {
    // Sales Chart
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Please include it in your HTML file.');
        return;
    }
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Sales',
                data: [65, 59, 80, 81, 56, 55],
                fill: false,
                borderColor: '#5C7285',
                backgroundColor: '#FFB4A2',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#5C7285'
                    }
                }
            }
        }
    });

    // Mobile Sidebar Toggle
    let sidebarActive = false;
    const sidebar = document.querySelector('.sidebar');
    
    function toggleSidebar() {
        sidebarActive = !sidebarActive;
        sidebar.classList.toggle('active');
    }

    // Add mobile menu button if needed
    if (window.innerWidth <= 768) {
        const menuButton = document.createElement('button');
        menuButton.classList.add('mobile-menu-btn');
        menuButton.innerHTML = '<i class="material-icons">menu</i>';
        document.querySelector('.main-header').prepend(menuButton);
        menuButton.addEventListener('click', toggleSidebar);
    }

    // Search Functionality
    const searchInput = document.querySelector('.filter-controls input[type="text"]');
    searchInput.addEventListener('input', function(e) {
        // Add your search logic here
        console.log('Searching for:', e.target.value);
    });
    const pageRoutes = {
        'Create Bilty': '/create-bilty',
        'Generate E-way Bill': '/generate-e-way-bill',
        'Export to Excel': '/export-to-excel',
        'Challan': '/challan',
        'Generate Daily Report': '/generate-daily-report',
        'Send Payment Reminder': '/send-payment-reminder',
        'Schedule Weekly Summary': '/schedule-weekly-summary'
    };

    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            const page = pageRoutes[this.textContent.trim()];
            if (page) {
                window.location.href = page;
            } else {
                console.log('Action clicked:', this.textContent);
            }
        });
    });
    // Status Filter
    const statusSelect = document.querySelector('.filter-controls select');
    statusSelect.addEventListener('change', function(e) {
        // Add your filter logic here
        console.log('Filtering by status:', e.target.value);
    });

    // Date Filter
    const dateInput = document.querySelector('.filter-controls input[type="date"]');
    dateInput.addEventListener('change', function(e) {
        // Add your date filter logic here
        console.log('Filtering by date:', e.target.value);
    });

    // Quick Action Buttons
    document.querySelectorAll('.action-buttons button').forEach(button => {
        button.addEventListener('click', function() {
            // Add your action logic here
            console.log('Action clicked:', this.textContent);
        });
    });

    // Report Generation Buttons
    document.querySelectorAll('.report-buttons button').forEach(button => {
        button.addEventListener('click', function() {
            // Add your report generation logic here
            console.log('Report action:', this.textContent);
        });
    });

    // Update Stats
    function updateStats() {
        // Add your stats update logic here
        // This could fetch new data from an API
        console.log('Updating stats...');
    }

    // Update stats every 5 minutes
    setInterval(updateStats, 300000);
});

// Add to your existing JavaScript
function generateDailyReport() {
    // Simulate report generation
    console.log('Generating daily report...');
    // You would typically make an API call here
    alert('Daily report generated successfully!');
}

function sendPaymentReminder() {
    // Simulate sending payment reminder
    console.log('Sending payment reminder...');
    // You would typically make an API call here
    alert('Payment reminder sent successfully!');
}

function scheduleWeeklySummary() {
    // Simulate scheduling weekly summary
    console.log('Scheduling weekly summary...');
    // You would typically make an API call here
    alert('Weekly summary scheduled successfully!');
}

// Example of how to handle form submission
function handleSearch(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const searchData = {
        keyword: formData.get('keyword'),
        status: formData.get('status'),
        date: formData.get('date')
    };
    
    // You would typically make an API call here
    console.log('Searching with data:', searchData);
}

// Example of data fetching function
async function fetchDashboardData() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/dashboard-data');
        const data = await response.json();
        
        // Update the UI with the fetched data
        updateDashboardUI(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function updateDashboardUI(data) {
    // Update stats
    document.querySelector('.today-sales').textContent = data.todaySales;
    document.querySelector('.week-sales').textContent = data.weekSales;
    document.querySelector('.month-sales').textContent = data.monthSales;
    document.querySelector('.quarter-sales').textContent = data.quarterSales;
    
    // Update chart
    salesChart.data.datasets[0].data = data.chartData;
    salesChart.update();
}