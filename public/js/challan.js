document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('challanForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const challanData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/generate-challan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(challanData),
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Challan generated successfully! Challan Number: ${result.challanNumber}`);
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the challan.');
        }
    });
});