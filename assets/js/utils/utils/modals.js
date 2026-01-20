/**
 * Modals Utility
 * Replaces native confirm/alert with custom UI
 */
(function () {
    window.StopIt.Utils.Modals = {

        /**
         * Show a confirmation modal
         * @param {string} title 
         * @param {string} message 
         * @param {Function} onConfirm 
         * @param {Function} onCancel 
         */
        confirm: function (title, message, onConfirm, onCancel) {
            this.createOverlay(`
                <h3 class="mb-md">${title}</h3>
                <p class="mb-lg text-secondary">${message}</p>
                <div class="flex-end gap-md">
                    <button class="btn btn-outline-secondary" id="modal-cancel">Annulla</button>
                    <button class="btn btn-primary" id="modal-confirm">Conferma</button>
                </div>
            `);

            document.getElementById('modal-cancel').addEventListener('click', () => {
                this.close();
                if (onCancel) onCancel();
            });

            document.getElementById('modal-confirm').addEventListener('click', () => {
                this.close();
                if (onConfirm) onConfirm();
            });
        },

        /**
         * Show an info modal (Alert replacement)
         * @param {string} title 
         * @param {string} message 
         */
        alert: function (title, message) {
            this.createOverlay(`
                <h3 class="mb-md">${title}</h3>
                <div class="mb-lg text-secondary">${message}</div> <!-- div to allow HTML -->
                <div class="flex-end">
                    <button class="btn btn-primary btn-block" id="modal-ok">OK</button>
                </div>
            `);

            document.getElementById('modal-ok').addEventListener('click', () => {
                this.close();
            });
        },

        createOverlay: function (contentHtml) {
            // Remove existing
            this.close();

            const overlay = document.createElement('div');
            overlay.id = 'custom-modal-overlay';
            overlay.className = 'overlay';
            overlay.innerHTML = `
                <div class="overlay-content fade-in" style="max-width: 400px; padding: 24px;">
                    ${contentHtml}
                </div>
            `;
            document.body.appendChild(overlay);
        },

        close: function () {
            const existing = document.getElementById('custom-modal-overlay');
            if (existing) existing.remove();
        }
    };
})();
