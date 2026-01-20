/**
 * Onboarding View
 * Initial setup wizard for new users
 */

(function () {
    window.StopIt.Views.OnboardingView = class OnboardingView {
        constructor() {
            this.step = 1;
            this.data = {
                quitDate: new Date().toISOString().split('T')[0] + 'T00:00', // Default today
                cigarettesPerDay: 10,
                costPerPack: 8.50,
                cigarettesPerPack: 20,
                motivation: ''
            };
        }

        async render(container) {
            container.innerHTML = `
                <div class="onboarding-view fade-in p-lg">
                    <div class="text-center mb-xl">
                        <div class="logo-large">🌱</div>
                        <h1>Iniziamo!</h1>
                        <p class="text-secondary">Pochi passi per configurare il tuo percorso.</p>
                    </div>

                    <div id="onboarding-steps">
                        <!-- Step Content -->
                    </div>

                    <div class="onboarding-actions mt-xl">
                        <button class="btn btn-secondary hidden" id="btn-back">Indietro</button>
                        <button class="btn btn-primary btn-lg" id="btn-next">Avanti</button>
                    </div>
                </div>
            `;

            this.container = container;
            this.renderStep();
            this.attachEventListeners();
        }

        renderStep() {
            const stepContainer = this.container.querySelector('#onboarding-steps');
            const btnBack = this.container.querySelector('#btn-back');
            const btnNext = this.container.querySelector('#btn-next');

            // Manage buttons visibility
            btnBack.classList.toggle('hidden', this.step === 1);
            btnNext.textContent = this.step === 4 ? 'Inizia la Nuova Vita! 🚀' : 'Avanti';

            let content = '';

            switch (this.step) {
                case 1:
                    content = `
                        <div class="step-card fade-in">
                            <h2 class="mb-md">1. La tua Data</h2>
                            <p class="mb-md">Quando hai fumato l'ultima sigaretta (o quando smetterai)?</p>
                            <input type="datetime-local" id="inp-quit-date" class="form-input" value="${this.data.quitDate}">
                            <p class="text-xs text-secondary mt-sm">Sarà il tuo anniversario di libertà!</p>
                        </div>
                    `;
                    break;
                case 2:
                    content = `
                        <div class="step-card fade-in">
                            <h2 class="mb-md">2. Le tue Abitudini</h2>
                            <div class="form-group">
                                <label>Sigarette al giorno</label>
                                <input type="number" id="inp-cigs" class="form-input" value="${this.data.cigarettesPerDay}" min="1">
                            </div>
                            <div class="form-group">
                                <label>Sigarette in un pacchetto</label>
                                <input type="number" id="inp-pack-size" class="form-input" value="${this.data.cigarettesPerPack}" min="1">
                            </div>
                        </div>
                    `;
                    break;
                case 3:
                    content = `
                        <div class="step-card fade-in">
                            <h2 class="mb-md">3. I Costi</h2>
                            <div class="form-group">
                                <label>Costo per pacchetto (CHF/EUR)</label>
                                <input type="number" id="inp-cost" class="form-input" value="${this.data.costPerPack}" step="0.10" min="0">
                            </div>
                            <p class="text-secondary">Calcoleremo quanti soldi risparmierai!</p>
                        </div>
                    `;
                    break;
                case 4:
                    content = `
                        <div class="step-card fade-in">
                            <h2 class="mb-md">4. La tua Motivazione</h2>
                            <p class="mb-md">Perché vuoi smettere? Scrivilo per ricordartelo nei momenti difficili.</p>
                            <textarea id="inp-motivation" class="form-input" rows="4" placeholder="Es: Per la mia salute, per i miei figli, per risparmiare...">${this.data.motivation}</textarea>
                        </div>
                    `;
                    break;
            }

            stepContainer.innerHTML = content;
        }

        attachEventListeners() {
            const btnBack = this.container.querySelector('#btn-back');
            const btnNext = this.container.querySelector('#btn-next');

            btnBack.addEventListener('click', () => {
                if (this.step > 1) {
                    this.saveCurrentStepData();
                    this.step--;
                    this.renderStep();
                }
            });

            btnNext.addEventListener('click', async () => {
                this.saveCurrentStepData();
                if (this.step < 4) {
                    this.step++;
                    this.renderStep();
                } else {
                    await this.completeOnboarding();
                }
            });
        }

        saveCurrentStepData() {
            try {
                switch (this.step) {
                    case 1:
                        this.data.quitDate = document.getElementById('inp-quit-date').value;
                        break;
                    case 2:
                        this.data.cigarettesPerDay = parseInt(document.getElementById('inp-cigs').value) || 0;
                        this.data.cigarettesPerPack = parseInt(document.getElementById('inp-pack-size').value) || 20;
                        break;
                    case 3:
                        this.data.costPerPack = parseFloat(document.getElementById('inp-cost').value) || 0;
                        break;
                    case 4:
                        this.data.motivation = document.getElementById('inp-motivation').value;
                        break;
                }
            } catch (e) {
                console.error("Error saving step data", e);
            }
        }

        async completeOnboarding() {
            try {
                // Save to state
                await window.StopIt.State.saveUserData({
                    ...this.data,
                    onboardingCompleted: true
                });

                // Navigate to dashboard
                window.stopItApp.navigateTo('dashboard');
            } catch (error) {
                window.StopIt.Utils.Notifications.show('Errore nel salvataggio: ' + error.message, 'error');
            }
        }
    };
})();
