/**
 * Profile View
 * User settings and data management
 */

(function () {
    window.StopIt.Views.ProfileView = class ProfileView {
        async render(container) {
            const userData = window.StopIt.State.getUserData();
            const username = window.StopIt.Auth.getCurrentUser();
            const Calcs = window.StopIt.Utils.Calculations;

            container.innerHTML = `
                <div class="profile-view fade-in">
                    <div class="profile-header-card mb-lg text-center">
                        <div class="avatar-circle mb-sm">${username ? username.charAt(0).toUpperCase() : '?'}</div>
                        <h2>${username}</h2>
                        <p class="text-secondary">${userData.quitDate ? 'Libera dal ' + new Date(userData.quitDate).toLocaleDateString() : 'Inizia oggi il tuo viaggio!'}</p>
                    </div>

                    <div class="settings-group card mb-md">
                        <h3>Dati Fumatore</h3>
                        <div class="setting-row">
                            <span>Sigarette al giorno</span>
                            <span class="setting-value">${userData.cigarettesPerDay || '-'}</span>
                        </div>
                        <div class="setting-row">
                            <span>Costo pacchetto</span>
                            <span class="setting-value">${Calcs.formatCurrency(userData.costPerPack || 0)}</span>
                        </div>
                        <div class="setting-row">
                            <span>Sigarette nel pacchetto</span>
                            <span class="setting-value">${userData.cigarettesPerPack || 20}</span>
                        </div>
                    </div>

                    <div class="settings-group card mb-md">
                        <h3>Impostazioni Personali</h3>
                        
                        <!-- SOS -->
                        <div class="form-group">
                            <label>Numero Partner SOS</label>
                            <input type="tel" id="partner-phone" class="form-input" 
                                value="${userData.partnerPhone || ''}" placeholder="+41 79 123 45 67">
                        </div>

                        <!-- Savings Goal -->
                        <div class="form-group mt-sm">
                            <label>Obiettivo Risparmio (Es. Vacanza)</label>
                            <div class="flex-gap">
                                <input type="text" id="savings-goal-name" class="form-input" 
                                    value="${userData.savingsGoal ? userData.savingsGoal.name : ''}" placeholder="Nome obiettivo">
                                <input type="number" id="savings-goal-amount" class="form-input" style="width: 100px" 
                                    value="${userData.savingsGoal ? userData.savingsGoal.amount : ''}" placeholder="Costo">
                            </div>
                        </div>

                        <!-- Cycle Tracking -->
                        <div class="form-group mt-md flex-between">
                            <label for="cycle-active">
                                🌙 Fase Mestruale / PMS
                                <div class="text-xs text-secondary">Attiva messaggi di supporto specifici</div>
                            </label>
                            <input type="checkbox" id="cycle-active" class="toggle-switch" ${userData.isCycleActive ? 'checked' : ''}>
                        </div>

                        <button class="btn btn-secondary btn-sm mt-md" id="save-settings">Salva Impostazioni</button>
                    </div>

                    <div class="card mb-lg bg-light-yellow" onclick="window.stopItApp.navigateTo('plans')">
                        <div class="flex-between">
                            <div>
                                <h3>🛡️ Piani Emergenza</h3>
                                <p class="text-secondary text-sm">Strategie Se... Allora</p>
                            </div>
                            <div class="text-xl">›</div>
                        </div>
                    </div>

                    <div class="settings-group card mb-lg">
                        <h3>Gestione Dati</h3>
                        
                        <button class="menu-btn" id="btn-export">
                            <span>📥 Esporta Dati (JSON)</span>
                            <span>›</span>
                        </button>
                        
                        <button class="menu-btn text-danger" id="btn-logout">
                            <span>🚪 Logout</span>
                            <span>›</span>
                        </button>
                        
                        <div class="divider my-md"></div>
                        
                        <button class="btn btn-danger btn-block btn-outline" id="btn-delete-account">
                            🗑️ Elimina Account e Dati
                        </button>
                    </div>

                    <div class="text-center text-xs text-secondary mb-xl">
                        StopIt v1.0 • Architettura Statica
                    </div>
                </div>
            `;

            this.attachEventListeners(container);
        }

        attachEventListeners(container) {
            // Save Settings
            container.querySelector('#save-settings').addEventListener('click', async () => {
                const phone = container.querySelector('#partner-phone').value;
                const goalName = container.querySelector('#savings-goal-name').value;
                const goalAmount = parseFloat(container.querySelector('#savings-goal-amount').value) || 0;
                const isCycleActive = container.querySelector('#cycle-active').checked;

                await window.StopIt.State.saveUserData({
                    partnerPhone: phone,
                    savingsGoal: { name: goalName, amount: goalAmount },
                    isCycleActive: isCycleActive
                });
                alert('Impostazioni salvate! ✅');
            });

            // Logout
            container.querySelector('#btn-logout').addEventListener('click', () => {
                if (confirm('Vuoi uscire?')) {
                    window.StopIt.Auth.logout();
                    window.location.reload();
                }
            });

            // Export
            container.querySelector('#btn-export').addEventListener('click', async () => {
                try {
                    const data = await window.StopIt.Auth.exportData();
                    // Save backup timestamp
                    await window.StopIt.State.saveUserData({ lastBackupDate: new Date().toISOString() });

                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `stopit-backup-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    alert('Backup scaricato con successo! ✅');
                } catch (e) {
                    alert('Errore export: ' + e.message);
                }
            });

            // Delete Account
            container.querySelector('#btn-delete-account').addEventListener('click', async () => {
                const username = window.StopIt.Auth.getCurrentUser();
                if (confirm(`ATTENZIONE: Stai per eliminare definitivamente l'account "${username}" e tutti i tuoi progressi. Questa azione è irreversibile.\n\nSei sicura?`)) {
                    await window.StopIt.DB.deleteUserData(username);
                    window.StopIt.Auth.logout();
                    window.location.reload();
                }
            });
        }
    };
})();
