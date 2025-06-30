document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('weeklySummaryForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const summaryData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/schedule-weekly-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(summaryData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Weekly summary scheduled successfully!');
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while scheduling the weekly summary.');
        }
    });
});