document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dailyReportForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const reportData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/generate-daily-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Daily report generated successfully!');
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the daily report.');
        }
    });
});