document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('paymentReminderForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const reminderData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/send-payment-reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reminderData),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Payment reminder sent successfully!');
                form.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while sending the payment reminder.');
        }
    });
});