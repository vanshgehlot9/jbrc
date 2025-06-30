document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('biltiesTableBody');
    const loadingDiv = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    
    let allBilties = [];
    
    async function loadBilties() {
        loadingDiv.style.display = 'block';
        tableBody.style.display = 'none';
        try {
            const response = await fetch('/api/bilties');
            if (response.ok) {
                allBilties = await response.json();
                renderBilties();
            } else {
                showError('Failed to load bilties');
            }
        } catch (error) {
            console.error('Error loading bilties:', error);
            showError('Network error: Please check your connection');
        } finally {
            loadingDiv.style.display = 'none';
        }
    }
    
    function filterAndSortBilties() {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredBilties = allBilties.filter(bilty => 
            (bilty.biltyNo && bilty.biltyNo.toString().includes(searchTerm)) ||
            bilty.consignorName.toLowerCase().includes(searchTerm) ||
            bilty.consigneeName.toLowerCase().includes(searchTerm) ||
            bilty.from.toLowerCase().includes(searchTerm) ||
            bilty.to.toLowerCase().includes(searchTerm)
        );

        const sortBy = sortSelect.value;
        filteredBilties.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date':
                    return new Date(b.biltyDate) - new Date(a.biltyDate);
                default:
                    return 0;
            }
        });
        return filteredBilties;
    }
    
    function renderBilties() {
        const biltiesToRender = filterAndSortBilties();
        tableBody.innerHTML = '';

        if (biltiesToRender.length === 0) {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = 'No bilties found.';
            return;
        }

        tableBody.style.display = '';
        
        biltiesToRender.forEach(bilty => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bilty.biltyNo}</td>
                <td>${formatDate(bilty.biltyDate)}</td>
                <td>${bilty.consignorName}</td>
                <td>${bilty.consigneeName}</td>
                <td>${bilty.from}</td>
                <td>${bilty.to}</td>
                <td>
                    <div class="action-buttons-small">
                        <button class="btn secondary small" onclick="viewBilty('${bilty._id}')">View</button>
                        <button class="btn primary small" onclick="editBilty('${bilty._id}')">Edit</button>
                        <button class="btn warning small" onclick="generateEwayBill('${bilty._id}')">E-Way Bill</button>
                        <button class="btn danger small" onclick="deleteBilty('${bilty._id}')">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN');
    }
    
    function showError(message) {
        loadingDiv.style.display = 'block';
        loadingDiv.innerHTML = `<p>${message}</p><button class="btn primary" onclick="location.reload()">Retry</button>`;
    }

    searchInput.addEventListener('input', renderBilties);
    sortSelect.addEventListener('change', renderBilties);
    document.getElementById('exportBtn').addEventListener('click', () => {
        window.location.href = '/api/bilties/export';
    });
    
    loadBilties();

    // --- Global functions for buttons ---
    window.viewBilty = function(biltyId) {
        window.open(`/api/bilty/${biltyId}/pdf`, '_blank');
    };
    
    window.editBilty = function(biltyId) {
        window.location.href = `/edit-bilty?id=${biltyId}`;
    };

    window.generateEwayBill = function(biltyId) {
        window.open(`/api/bilty/${biltyId}/ewaybill`, '_blank');
    };

    window.deleteBilty = async function(biltyId) {
        if (!confirm('Are you sure you want to delete this bilty? This action cannot be undone.')) {
            return;
        }
        
        console.log(`Attempting to delete bilty with ID: ${biltyId}`);
        try {
            const response = await fetch(`/api/bilty/${biltyId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok) {
                console.log('Delete successful on server. Updating UI.');
                alert(result.message || 'Bilty deleted successfully!');
                allBilties = allBilties.filter(b => b._id !== biltyId);
                renderBilties();
            } else {
                console.error('Server responded with an error:', result);
                alert(`Failed to delete bilty: ${result.message}`);
            }
        } catch (error) {
            console.error('Error during fetch for delete:', error);
            alert('A network or JavaScript error occurred while deleting the bilty. Check the console for details.');
        }
    };
}); 