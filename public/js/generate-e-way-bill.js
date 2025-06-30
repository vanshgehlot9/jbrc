document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('eWayBillForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const eWayBillData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/generate-e-way-bill', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eWayBillData),
            });

            const result = await response.json();

            if (response.ok) {
                alert(`E-way Bill generated successfully! Bill Number: ${result.billNumber}`);
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the E-way Bill.');
        }
    });
});