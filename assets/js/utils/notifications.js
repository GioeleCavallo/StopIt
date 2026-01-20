/**
 * Notifications Module (Toast / Push Style)
 */
(function () {
    window.StopIt.Utils.Notifications = {

        /**
         * Show a notification
         * @param {string} message - The text to display
         * @param {string} type - 'success', 'error', 'info', 'warning'
         * @param {number} duration - Duration in ms (default 3000)
         */
        show: function (message, type = 'info', duration = 3000) {
            this.createContainer();

            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type} slide-in-top`;

            let icon = 'ℹ️';
            if (type === 'success') icon = '✅';
            if (type === 'error') icon = '⚠️';
            if (type === 'warning') icon = '🔔';

            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${message}</div>
            `;

            const container = document.getElementById('toast-container');
            container.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.classList.remove('slide-in-top');
                toast.classList.add('slide-out-top');
                setTimeout(() => {
                    toast.remove();
                }, 500); // Wait for animation
            }, duration);
        },

        createContainer: function () {
            if (!document.getElementById('toast-container')) {
                const container = document.createElement('div');
                container.id = 'toast-container';
                document.body.appendChild(container);
            }
        }
    };
})();
