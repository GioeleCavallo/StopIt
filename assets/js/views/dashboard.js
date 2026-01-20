/**
 * Dashboard View
 */

(function () {
    window.StopIt.Views.DashboardView = class DashboardView {
        constructor() {
            this.userData = null;
        }

        async render(container) {
            const userData = window.StopIt.State.getUserData();
            const logs = window.StopIt.State.getLogs();
            const Calcs = window.StopIt.Utils.Calculations;

            // If no user data or quit date, render the no-data state
            if (!userData || !userData.quitDate) {
                container.innerHTML = this.renderNoData();
                this.attachNoDataListeners(container);
                return;
            }

            // Calculations
            const daysSmokeFree = Calcs.calculateDaysSmokeFree(userData.quitDate);
            const cigsAvoided = Calcs.calculateCigarettesAvoided(userData.quitDate, userData.cigarettesPerDay);
            const moneySaved = Calcs.calculateMoneySaved(userData.quitDate, userData.cigarettesPerDay, userData.costPerPack);
            const streak = Calcs.calculateStreak ? Calcs.calculateStreak(userData.quitDate) : daysSmokeFree;

            container.innerHTML = `
                <div class="dashboard-view fade-in">
                    
                    <!-- HERO ACTION: Panic Button -->
                    <div class="hero-section text-center mb-lg pt-md">
                        <button class="btn btn-danger btn-xl pulse-animation shadow-lg" id="btn-craving-main" style="width: 100%; border-radius: 24px; padding: 24px;">
                            <div class="text-3xl mb-xs">🚨</div>
                            <div class="text-2xl font-bold">HO VOGLIA</div>
                            <div class="text-sm opacity-75">Clicca per aiuto immediato</div>
                        </button>
                    </div>

                    <!-- Header Stats -->
                    <div class="header-section mb-lg">
                        <h2 class="text-xl">Ciao, ${window.StopIt.Auth.getCurrentUser()}! 👋</h2>
                        <p class="text-secondary">Sei libera da <strong>${daysSmokeFree}</strong> giorni.</p>
                    </div>

                    <!-- Main Stats Cards -->
                    <div class="stats-grid mb-lg">
                        <div class="stat-card cursor-pointer" id="btn-streak-calendar">
                            <div class="stat-icon">🔥</div>
                            <div class="stat-value">${streak}</div>
                            <div class="stat-label">Serie (Giorni) ›</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🚬</div>
                            <div class="stat-value">${cigsAvoided}</div>
                            <div class="stat-label">Non fumate</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-value">${Calcs.formatCurrency(moneySaved)}</div>
                            <div class="stat-label">Risparmiati</div>
                        </div>
                    </div>

                    <!-- JITAI Teaer / Support Buttons -->
                    <h3 class="mb-sm">Supporto Rapido</h3>
                    <div class="jitai-grid mb-xl">
                        <button class="jitai-btn" data-action="breathe">
                            <span class="jitai-icon">😮‍💨</span>
                            <span class="jitai-label">Respiro</span>
                        </button>
                        <button class="jitai-btn" data-action="distract">
                            <span class="jitai-icon">🎮</span>
                            <span class="jitai-label">Svago</span>
                        </button>
                        <button class="jitai-btn" data-action="motivate">
                            <span class="jitai-icon">💪</span>
                            <span class="jitai-label">Forza</span>
                        </button>
                    </div>

                    <!-- Latest Badge (Teaser) -->
                    <div class="card bg-accent-light mb-xl cursor-pointer" id="btn-badges-dash">
                        <div class="flex-between">
                            <div>
                                <h3>I tuoi Traguardi</h3>
                                <p class="text-secondary text-sm">Vedi tutti i badge ›</p>
                            </div>
                            <div class="text-2xl">🏆</div>
                        </div>
                    </div>
                    
                    <!-- SOS Floating Button -->
                    <button class="sos-fab" id="btn-sos-floating">
                        🆘
                    </button>
                </div>

                <!-- FIRST AID OVERLAY (Hidden by default) -->
                <div id="first-aid-overlay" class="overlay hidden">
                    <div class="overlay-content">
                        <div class="flex-between mb-md">
                            <h2>🚑 Pronto Soccorso</h2>
                            <button id="close-overlay" class="btn-icon">✕</button>
                        </div>
                        <p class="text-center mb-lg text-lg">Cosa sta succedendo?</p>
                        <div class="triggers-grid-overlay" id="fa-triggers-grid">
                            <!-- Populated via JS -->
                        </div>
                    </div>
                </div>
            `;

            this.attachEventListeners(container);
        }

        // calculateStats() {
        //     const Calcs = window.StopIt.Utils.Calculations;
        //     return {
        //         days: Calcs.calculateDaysSmokeFree(this.userData.quitDate),
        //         cigarettesAvoided: Calcs.calculateCigarettesAvoided(this.userData.quitDate, this.userData.cigarettesPerDay),
        //         moneySaved: Calcs.formatCurrency(Calcs.calculateMoneySaved(this.userData.quitDate, this.userData.cigarettesPerDay, this.userData.costPerPack)),
        //         lifeTime: Calcs.calculateLifeTimeGained(this.userData.quitDate, this.userData.cigarettesPerDay).formatted,
        //         streak: Calcs.calculateStreak(this.userData.quitDate)
        //     };
        // }

        renderNoData() {
            return `
                <div class="empty-state">
                    <h2>Benvenuta! 🌟</h2>
                    <p>Completa il tuo profilo per iniziare</p>
                    <button class="btn btn-primary" id="complete-profile">Completa Profilo</button>
                </div>
            `;
        }

        attachNoDataListeners(container) {
            container.querySelector('#complete-profile')?.addEventListener('click', async () => {
                // Mock onboarding completion for now - Dev helper
                if (window.StopIt.Utils.Modals) {
                    window.StopIt.Utils.Modals.confirm(
                        'Simulazione',
                        'Simulare completamento onboarding?',
                        async () => {
                            await window.StopIt.State.saveUserData({
                                quitDate: new Date().toISOString(),
                                cigarettesPerDay: 10,
                                costPerPack: 8,
                                onboardingCompleted: true
                            });
                            window.location.reload();
                        }
                    );
                }
            });
        }

        attachEventListeners(container) {
            // Panic Button -> Open Overlay
            container.querySelector('#btn-craving-main').addEventListener('click', () => {
                this.openFirstAid(container);
            });

            // Close Overlay
            container.querySelector('#close-overlay').addEventListener('click', () => {
                container.querySelector('#first-aid-overlay').classList.add('hidden');
            });

            // Navigate
            container.querySelector('#btn-streak-calendar').addEventListener('click', () => window.stopItApp.navigateTo('calendar'));
            container.querySelector('#btn-badges-dash').addEventListener('click', () => window.stopItApp.navigateTo('badges'));

            // JITAI Buttons
            container.querySelectorAll('.jitai-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleJITAI(btn.dataset.action));
            });

            // SOS Button
            container.querySelector('#btn-sos-floating').addEventListener('click', () => {
                const userData = window.StopIt.State.getUserData();
                if (userData.partnerPhone) {
                    const phone = userData.partnerPhone.replace(/\D/g, ''); // Remove non-digits
                    const msg = encodeURIComponent("Ciao! 🆘 Sto avendo un momento difficile e ho una forte voglia di fumare. Mi puoi chiamare o scrivere? Ho bisogno di supporto. ❤️");
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                } else {
                    window.StopIt.Utils.Modals.confirm(
                        'Numero SOS Mancante',
                        "Non hai ancora impostato un numero SOS nel profilo. Vuoi farlo ora?",
                        () => window.stopItApp.navigateTo('profile')
                    );
                }
            });
        }

        openFirstAid(container) {
            const overlay = container.querySelector('#first-aid-overlay');
            const grid = container.querySelector('#fa-triggers-grid');
            const triggers = window.StopIt.Utils.Triggers.getAllTriggers().sort((a, b) => a.label.localeCompare(b.label));

            grid.innerHTML = triggers.map(t => `
                <button class="fa-trigger-btn" data-trigger="${t.id}">
                    <div class="text-2xl mb-xs">${t.icon}</div>
                    <div class="text-xs font-bold text-center">${t.label}</div>
                </button>
            `).join('');

            overlay.classList.remove('hidden');

            // Attach clicks
            grid.querySelectorAll('.fa-trigger-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const triggerId = btn.dataset.trigger;
                    this.showAdviceModal(container, triggerId);
                });
            });
        }

        showAdviceModal(container, triggerId) {
            // Hide trigger grid, show advice
            const overlayContent = container.querySelector('.overlay-content');

            // Get Plan
            const userPlans = window.StopIt.State.getPlans?.() || [];
            const userPlan = userPlans.find(p => p.trigger === triggerId);
            const advice = userPlan ? userPlan.action : this.getDefaultAdvice(triggerId);
            const triggerLabel = window.StopIt.Utils.Triggers.getTriggerLabel(triggerId);

            // Re-render overlay content for Advice
            overlayContent.innerHTML = `
                <div class="text-center fade-in">
                    <div class="text-4xl mb-md">💡</div>
                    <h2 class="mb-lg">Per "${triggerLabel}" prova questo:</h2>
                    
                    <div class="card bg-primary-light mb-xl p-lg">
                        <p class="text-xl font-bold text-primary-dark" style="line-height: 1.5;">${advice}</p>
                    </div>

                    <p class="mb-lg text-secondary">Fallo ora! Ti ha aiutato a passare la voglia?</p>

                    <div class="flex-column gap-md">
                        <button class="btn btn-success btn-lg" id="btn-fa-success">
                            ✅ Sì, ha funzionato!
                        </button>
                        <button class="btn btn-outline-danger" id="btn-fa-fail">
                            ⚠️ No, ho ancora voglia...
                        </button>
                    </div>
                </div>
            `;

            // Handlers
            overlayContent.querySelector('#btn-fa-success').addEventListener('click', () => {
                window.StopIt.State.addLog({
                    type: 'craving',
                    outcome: 'resisted',
                    intensity: 3, // Assumed medium
                    triggers: [triggerId],
                    strategies: ['default_plan_first_aid'],
                    date: new Date().toISOString()
                });

                window.StopIt.Utils.Notifications.show("Grande! Voglia superata! 🎉", "success");
                container.querySelector('#first-aid-overlay').classList.add('hidden');
                this.render(container); // Refresh to show stats update
            });

            overlayContent.querySelector('#btn-fa-fail').addEventListener('click', () => {
                // Direct navigation for better UX
                container.querySelector('#first-aid-overlay').classList.add('hidden');
                window.stopItApp.navigateTo('craving');
            });
        }

        getDefaultAdvice(triggerId) {
            const defaults = {
                'stress': "Fai 10 respiri profondi di pancia. Inspira 4s, trattieni 4s, espira 4s.",
                'social': "Tieni un drink analcolico in mano per occupare il gesto.",
                'boredom': "Guarda un video divertente o leggi una pagina di un libro.",
                'after_meal': "Lavati subito i denti con un dentifricio alla menta forte.",
                'coffee': "Bevi un bicchiere d'acqua prima e dopo il caffè.",
                'alcohol': "Alterna ogni drink con un bicchiere d'acqua. Ricorda il tuo obiettivo.",
                'work': "Fai 2 minuti di stretching sulla sedia.",
                'driving': "Metti la tua playlist preferita e canta a squarciagola.",
                'phone': "Scarabocchia su un foglio mentre parli.",
                'morning': "Fai 5 minuti di stretching appena sveglia.",
                'evening': "Prepara una tisana calda e rilassante.",
                'anxiety': "Chiama il tuo ragazzo o un'amica fidata per sfogarti.",
                'sadness': "Chiama il tuo ragazzo per un abbraccio virtuale.",
                'anger': "Scrivi su un foglio cosa ti fa arrabbiare, poi strappalo in mille pezzi.",
                'celebration': "Scatta una foto ricordo del momento invece di fumare.",
                'break': "Fai un giro dell'isolato a passo veloce.",
                'menstrual': "Usa la borsa dell'acqua calda, prenditi cura di te e riposa.",
                'other': "Bevi un grande bicchiere d'acqua fresca."
            };
            return defaults[triggerId] || "Bevi un bicchiere d'acqua e fai 5 respiri profondi.";
        }

        handleJITAI(action) {
            let title = '';
            let text = '';

            if (action === 'breathe') {
                title = 'Respiro Quadrato';
                text = 'Inspira per 4 secondi...\nTrattieni per 4...\nEspira per 4...\nTrattieni per 4.\n\nRipeti per 3 volte.';
            } else if (action === 'distract') {
                title = 'Distrazione Rapida';
                const tasks = ['Bevi un bicchiere d\'acqua lento.', 'Conta all\'indietro da 100 a 7.', 'Fai 10 saltelli sul posto.', 'Guarda fuori dalla finestra e trova 3 cose blu.'];
                text = tasks[Math.floor(Math.random() * tasks.length)];
            } else if (action === 'motivate') {
                title = 'Motivazione';
                const motives = ['Il dolore passa, l\'orgoglio resta.', 'Ogni voglia dura solo 3-5 minuti. Resisti!', 'Non hai fatto tutta questa strada per tornare indietro.'];
                text = motives[Math.floor(Math.random() * motives.length)];
            }

            // Using Notifications instead of alert for better UX
            window.StopIt.Utils.Notifications.show(`${title}: ${text}`, 'info', 6000);
        }
    };
})();
