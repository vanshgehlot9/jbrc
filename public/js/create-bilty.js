document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('biltyForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item-btn');
    
    // Set default date
    document.getElementById('biltyDate').value = new Date().toISOString().split('T')[0];

    // --- Item Row Management ---
    function createItemRow() {
        const itemRow = document.createElement('div');
        itemRow.classList.add('item-row');
        itemRow.innerHTML = `
            <div class="form-group" style="flex: 1;"><input type="number" name="quantity" placeholder="Pkgs" required></div>
            <div class="form-group" style="flex: 3;"><input type="text" name="goodsDescription" placeholder="Description" required></div>
            <div class="form-group" style="flex: 2;"><input type="text" name="hsnCode" placeholder="HSN Code"></div>
            <div class="form-group" style="flex: 1;"><input type="number" name="weight" placeholder="Actual Wt" step="0.01" required></div>
            <div class="form-group" style="flex: 1;"><input type="number" name="chargedWeight" placeholder="Charged Wt" step="0.01" required></div>
            <div class="form-group" style="flex: 2;"><input type="text" name="rate" placeholder="Rate (e.g., 100 Per Qntl)" required></div>
            <button type="button" class="remove-item-btn">&times;</button>
        `;
        itemsContainer.appendChild(itemRow);
        itemRow.querySelector('.remove-item-btn').addEventListener('click', () => itemRow.remove());
    }
    addItemBtn.addEventListener('click', createItemRow);
    createItemRow(); // Add one item row by default

    // --- Automatic Calculation for Charges ---
    const chargeFields = ['freight', 'pf', 'lc', 'bc'];
    const gstFields = ['cgst', 'sgst', 'igst'];
    const totalInput = document.getElementById('total');
    const grandTotalInput = document.getElementById('grandTotal');
    const advanceInput = document.getElementById('advance');

    function calculateTotals() {
        const subTotal = chargeFields.reduce((acc, field) => acc + (parseFloat(document.getElementById(field).value) || 0), 0);
        const totalGst = gstFields.reduce((acc, field) => acc + (parseFloat(document.getElementById(field).value) || 0), 0);
        const advance = parseFloat(advanceInput.value) || 0;
        
        totalInput.value = subTotal.toFixed(2);
        grandTotalInput.value = (subTotal + totalGst - advance).toFixed(2);
    }
    [...chargeFields, ...gstFields, 'advance'].forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', calculateTotals);
    });

    // --- Form Submission ---
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        const formData = new FormData(form);
        const biltyData = {
            charges: {},
            items: []
        };

        // Extract all fields
        for (const [key, value] of formData.entries()) {
            if (['freight', 'pf', 'lc', 'bc', 'total', 'cgst', 'sgst', 'igst', 'advance', 'grandTotal'].includes(key)) {
                biltyData.charges[key] = parseFloat(value) || 0;
            } else if (['quantity', 'weight', 'chargedWeight'].includes(key)) {
                // These will be handled with items
            } else if (['goodsDescription', 'rate'].includes(key)) {
                 // These will be handled with items
            }
             else {
                biltyData[key] = value;
            }
        }
        biltyData.grossValue = parseFloat(biltyData.grossValue) || 0;
        
        // Extract items
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const item = {};
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                 if (input.name === 'quantity' || input.name === 'weight' || input.name === 'chargedWeight') {
                    item[input.name] = parseFloat(input.value) || 0;
                } else {
                    item[input.name] = input.value;
                }
            });
            biltyData.items.push(item);
        });

        // Basic Validation
        if (biltyData.items.length === 0) {
            showMessage('Please add at least one item.', 'error');
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/create-bilty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(biltyData),
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(`Bilty #${result.biltyNo} created!`, 'success');
                form.reset();
                document.getElementById('biltyDate').value = new Date().toISOString().split('T')[0];
                itemsContainer.innerHTML = '';
                createItemRow();
                calculateTotals();
            } else {
                showMessage(`Error: ${result.message || 'Failed to create bilty'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Network error. Please try again.', 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });

    // --- Utility Functions ---
    function showMessage(message, type = 'success') {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        form.insertBefore(messageDiv, form.firstChild);

        if (type === 'success') {
            setTimeout(() => messageDiv.remove(), 4000);
        }
    }
});