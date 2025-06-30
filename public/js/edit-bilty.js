document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('biltyForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const biltyId = new URLSearchParams(window.location.search).get('id');

    if (!biltyId) {
        document.body.innerHTML = '<h1>Bilty ID not found. Please go back and select a bilty to edit.</h1>';
        return;
    }

    // --- Item Row Management ---
    function createItemRow(item = {}) {
        const itemRow = document.createElement('div');
        itemRow.classList.add('item-row');
        itemRow.innerHTML = `
            <div class="form-group" style="flex: 1;"><input type="number" name="quantity" placeholder="Pkgs" required value="${item.quantity || ''}"></div>
            <div class="form-group" style="flex: 3;"><input type="text" name="goodsDescription" placeholder="Description" required value="${item.goodsDescription || ''}"></div>
            <div class="form-group" style="flex: 2;"><input type="text" name="hsnCode" placeholder="HSN Code" value="${item.hsnCode || ''}"></div>
            <div class="form-group" style="flex: 1;"><input type="number" name="weight" placeholder="Actual Wt" step="0.01" required value="${item.weight || ''}"></div>
            <div class="form-group" style="flex: 1;"><input type="number" name="chargedWeight" placeholder="Charged Wt" step="0.01" required value="${item.chargedWeight || ''}"></div>
            <div class="form-group" style="flex: 2;"><input type="text" name="rate" placeholder="Rate" required value="${item.rate || ''}"></div>
            <button type="button" class="remove-item-btn">&times;</button>
        `;
        itemsContainer.appendChild(itemRow);
        itemRow.querySelector('.remove-item-btn').addEventListener('click', () => itemRow.remove());
    }
    addItemBtn.addEventListener('click', () => createItemRow());

    // --- Automatic Calculation for Charges ---
    const chargeFields = ['freight', 'pf', 'lc', 'bc', 'cgst', 'sgst', 'igst'];
    const totalInput = document.getElementById('total');
    const grandTotalInput = document.getElementById('grandTotal');
    const advanceInput = document.getElementById('advance');

    function calculateTotals() {
        const subTotalVal = (parseFloat(document.getElementById('freight').value) || 0) + (parseFloat(document.getElementById('pf').value) || 0) + (parseFloat(document.getElementById('lc').value) || 0) + (parseFloat(document.getElementById('bc').value) || 0);
        const totalGst = (parseFloat(document.getElementById('cgst').value) || 0) + (parseFloat(document.getElementById('sgst').value) || 0) + (parseFloat(document.getElementById('igst').value) || 0);
        const advance = parseFloat(advanceInput.value) || 0;
        
        totalInput.value = subTotalVal.toFixed(2);
        grandTotalInput.value = (subTotalVal + totalGst - advance).toFixed(2);
    }
    [...chargeFields, 'advance'].forEach(fieldId => document.getElementById(fieldId).addEventListener('input', calculateTotals));

    // --- Load Existing Data ---
    async function loadBiltyData() {
        try {
            const response = await fetch(`/api/bilty/${biltyId}`);
            if (!response.ok) throw new Error('Failed to fetch bilty data');
            const bilty = await response.json();
            
            // Populate simple fields
            Object.keys(bilty).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (key === 'biltyDate') {
                        input.value = new Date(bilty[key]).toISOString().split('T')[0];
                    } else {
                        input.value = bilty[key];
                    }
                }
            });

            // Populate charges
            if (bilty.charges) {
                Object.keys(bilty.charges).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) input.value = bilty.charges[key];
                });
            }

            // Populate items
            itemsContainer.innerHTML = ''; // Clear any default
            if (bilty.items && bilty.items.length > 0) {
                bilty.items.forEach(item => createItemRow(item));
            } else {
                createItemRow(); // Create one empty row if no items
            }

            calculateTotals(); // Recalculate totals after populating
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }

    // --- Form Submission ---
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        submitButton.disabled = true;

        const formData = new FormData(form);
        const biltyData = { charges: {}, items: [] };

        for (const [key, value] of formData.entries()) {
             if (['freight', 'pf', 'lc', 'bc', 'total', 'cgst', 'sgst', 'igst', 'advance', 'grandTotal'].includes(key)) {
                biltyData.charges[key] = parseFloat(value) || 0;
            } else if (!['quantity', 'goodsDescription', 'weight', 'chargedWeight', 'rate', 'hsnCode'].includes(key)) {
                biltyData[key] = value;
            }
        }
        biltyData.grossValue = parseFloat(biltyData.grossValue) || 0;
        
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const item = {};
            row.querySelectorAll('input').forEach(input => {
                item[input.name] = input.type === 'number' ? parseFloat(input.value) || 0 : input.value;
            });
            biltyData.items.push(item);
        });

        try {
            const response = await fetch(`/api/bilty/${biltyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(biltyData),
            });
            const result = await response.json();
            if (response.ok) {
                showMessage('Bilty updated successfully!', 'success');
                setTimeout(() => window.location.href = '/view-bilties', 1500);
            } else {
                throw new Error(result.message || 'Failed to update bilty');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
    
    function showMessage(message, type = 'success') {
        // ... (message display logic)
    }

    loadBiltyData();
}); 