/**
 * Main Application Entry Point
 */

(function () {
    class App {
        constructor() {
            this.currentView = null;
            this.initialized = false;
        }

        async init() {
            try {
                console.log('🚀 Initializing StopIt...');

                // Initialize database
                await window.StopIt.DB.init();

                // Check if user has a session
                if (window.StopIt.Auth.hasSession()) {
                    this.showAuthScreen();
                } else {
                    this.showAuthScreen();
                }

                this.setupEventListeners();
                this.hideLoadingScreen();
                this.initialized = true;
                console.log('✅ StopIt initialized');
            } catch (error) {
                console.error('❌ Initialization error:', error);
                alert('Errore di inizializzazione: ' + error.message);
            }
        }

        setupEventListeners() {
            // Login Form
            document.getElementById('form-login')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });

            // Register Form
            document.getElementById('form-register')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });

            // Toggle Forms
            document.getElementById('show-register')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForms();
            });

            document.getElementById('show-login')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForms();
            });

            // Navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = item.dataset.view;
                    this.navigateTo(view);
                });
            });
        }

        async handleLogin() {
            try {
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                await window.StopIt.Auth.login(username, password);
                await window.StopIt.State.loadUserData();

                const userData = window.StopIt.State.getUserData();
                if (!userData.onboardingCompleted) {
                    this.navigateTo('onboarding');
                } else {
                    this.showMainApp();
                }
            } catch (error) {
                alert(error.message);
            }
        }

        async handleRegister() {
            try {
                const username = document.getElementById('reg-username').value;
                const password = document.getElementById('reg-password').value;
                const confirm = document.getElementById('reg-password-confirm').value;

                if (password !== confirm) throw new Error('Le password non coincidono');

                await window.StopIt.Auth.register(username, password);
                await window.StopIt.State.loadUserData();

                // Show app shell first, then navigate to onboarding
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');
                this.navigateTo('onboarding');
            } catch (error) {
                alert(error.message);
            }
        }

        toggleAuthForms() {
            document.getElementById('login-form').classList.toggle('hidden');
            document.getElementById('register-form').classList.toggle('hidden');
        }

        hideLoadingScreen() {
            const screen = document.getElementById('loading-screen');
            if (screen) {
                screen.classList.add('animate-fadeOut');
                setTimeout(() => screen.classList.add('hidden'), 300);
            }
        }

        showAuthScreen() {
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('main-app').classList.add('hidden');
        }

        showMainApp() {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');

            const userData = window.StopIt.State.getUserData();
            if (!userData.onboardingCompleted) {
                this.navigateTo('onboarding');
            } else {
                this.navigateTo('dashboard');

                // Backup Reminder (Req #33)
                const lastBackup = userData.lastBackupDate ? new Date(userData.lastBackupDate) : null;
                const now = new Date();
                const daysSinceBackup = lastBackup ? (now - lastBackup) / (1000 * 60 * 60 * 24) : 999;

                if (daysSinceBackup > 7) {
                    setTimeout(() => {
                        window.StopIt.Utils.Modals.confirm(
                            'Backup Consigliato',
                            '⚠️ È passato molto tempo dal tuo ultimo backup. Vuoi scaricare i tuoi dati ora per sicurezza?',
                            () => this.navigateTo('profile')
                        );
                    }, 2000);
                }

                // Check for new badges (time-based)
                setTimeout(() => {
                    console.log('⏰ Time-based badge check triggered');
                    this.checkAndUnlockBadges();
                }, 1000);

                // Tutorial (Req #34)
                if (!userData.tutorialSeen) {
                    setTimeout(() => {
                        window.StopIt.Tutorial.start();
                        window.StopIt.State.saveUserData({ tutorialSeen: true });
                    }, 1000);
                }
            }
        }

        async navigateTo(viewName) {
            // Update nav
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // Only highlight nav if it exists (onboarding/plans might not be in nav)
            document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

            const container = document.getElementById('main-view');
            container.innerHTML = '<div class="spinner"></div>';

            let ViewClass;
            switch (viewName) {
                case 'dashboard': ViewClass = window.StopIt.Views.DashboardView; break;
                case 'craving': ViewClass = window.StopIt.Views.CravingView; break;
                case 'stats': ViewClass = window.StopIt.Views.StatsView; break;
                case 'badges': ViewClass = window.StopIt.Views.BadgesView; break;
                case 'profile': ViewClass = window.StopIt.Views.ProfileView; break;
                case 'onboarding': ViewClass = window.StopIt.Views.OnboardingView; break;
                case 'plans': ViewClass = window.StopIt.Views.PlansView; break;
                case 'calendar': ViewClass = window.StopIt.Views.CalendarView; break;
                default: ViewClass = window.StopIt.Views.DashboardView;
            }

            if (ViewClass) {
                const view = new ViewClass();
                await view.render(container);
                this.currentView = view;
            }
        }

        /**
         * Check and unlock new badges based on current data
         */
        /**
         * Check and unlock new badges based on current data
         * AND remove badges if conditions are no longer met (Relapse)
         */
        async checkAndUnlockBadges() {
            console.log('🛡️ checkAndUnlockBadges running...');
            try {
                const userData = window.StopIt.State.getUserData();
                const logs = window.StopIt.State.getLogs();
                const plans = window.StopIt.State.getPlans?.() || [];
                let unlockedBadges = window.StopIt.State.getBadges();

                // 1. REVOCATION CHECK
                const badgesToRemove = window.StopIt.Utils.BadgesEngine.checkRevocation(userData, logs, plans, unlockedBadges);

                if (badgesToRemove.length > 0) {
                    unlockedBadges = unlockedBadges.filter(b => !badgesToRemove.includes(b.id));
                    await window.StopIt.State.overwriteBadges(unlockedBadges);
                    console.log('Revoked badges:', badgesToRemove);
                }

                // 2. UNLOCK CHECK
                const newBadges = window.StopIt.Utils.BadgesEngine.checkBadges(userData, logs, plans, unlockedBadges);

                if (newBadges.length > 0) {
                    // Unlock all first to save state
                    for (const badge of newBadges) {
                        await window.StopIt.State.unlockBadge(badge.id, badge);
                    }
                    // Then show UI for each sequentially
                    this.showBadgeUnlockQueue(newBadges);
                }
            } catch (error) {
                console.error('Error checking badges:', error);
            }
        }

        showBadgeUnlockQueue(badges) {
            if (badges.length === 0) return;
            const badge = badges[0];
            const remaining = badges.slice(1);

            // Custom "Bravissima" Modal
            const content = `
                <div class="text-center">
                    <h2 class="text-xl text-primary font-bold mb-md">Bravissima! 🎉</h2>
                    <div class="text-6xl mb-md pulse-animation">${badge.icon}</div>
                    <div class="card bg-success-pale p-md mb-lg">
                        <h3 class="font-bold text-lg mb-xs">${badge.name}</h3>
                        <p class="text-secondary">${badge.description}</p>
                    </div>
                </div>
            `;

            if (window.StopIt.Utils.Modals) {
                window.StopIt.Utils.Modals.alert('Nuovo Traguardo!', content);
                // Hook into the 'OK' button of the modal to show the next one
                // This is a bit hacky because Modals.alert doesn't return a promise or callback for 'close'
                // We'll attach a one-time listener to the specific ID we know Modals uses
                setTimeout(() => {
                    const okBtn = document.getElementById('modal-ok');
                    if (okBtn) {
                        const oldClick = okBtn.onclick; // Preserving existing close logic usually handled by Modals.js event listener which is added internally
                        // We basically need to "wait" for it to close.
                        // Cleaner approach: The Modals.alert closes on click. We just need to trigger next.
                        okBtn.addEventListener('click', () => {
                            setTimeout(() => this.showBadgeUnlockQueue(remaining), 300);
                        }, { once: true });
                    }
                }, 100);
            } else {
                alert(`🏆 Nuovo Badge: ${badge.name}`);
                this.showBadgeUnlockQueue(remaining);
            }
        }

        // Test function exposed for console usage
        triggerTestBadge(badgeId) {
            const badge = window.StopIt.Utils.BadgesEngine.getBadgeById(badgeId) || {
                name: 'Badge Test',
                description: 'Descrizione di prova per il badge.',
                icon: '🧪'
            };
            this.showBadgeUnlockQueue([badge]);
        }
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        window.stopItApp = new App();
        window.stopItApp.init();
    });
})();
