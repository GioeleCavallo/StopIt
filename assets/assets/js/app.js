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
                // Critical error, use Modal
                if (window.StopIt.Utils.Modals) window.StopIt.Utils.Modals.alert('Errore di inizializzazione', error.message);
                else alert(error.message);
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
                window.StopIt.Utils.Notifications.show(error.message, 'error');
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
                window.StopIt.Utils.Notifications.show(error.message, 'error');
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
            try {
                const userData = window.StopIt.State.getUserData();
                const logs = window.StopIt.State.getLogs();
                const plans = window.StopIt.State.getPlans?.() || [];
                let unlockedBadges = window.StopIt.State.getBadges();

                // 1. REVOCATION CHECK (First!)
                // If the user has relapsed recently, we might need to remove some badges
                const badgesToRemove = window.StopIt.Utils.BadgesEngine.checkRevocation(logs, unlockedBadges);

                if (badgesToRemove.length > 0) {
                    // Filter out revoked badges from the current list in memory
                    unlockedBadges = unlockedBadges.filter(b => !badgesToRemove.includes(b.id));

                    // Persist the changes: "Set" the new list (which is smaller)
                    // Note: We need a method in State to overwrite badges list
                    await window.StopIt.State.overwriteBadges(unlockedBadges);

                    // console.log('Revoked badges:', badgesToRemove);
                }

                // 2. UNLOCK CHECK
                const newBadges = window.StopIt.Utils.BadgesEngine.checkBadges(userData, logs, plans, unlockedBadges);

                if (newBadges.length > 0) {
                    for (const badge of newBadges) {
                        await window.StopIt.State.unlockBadge(badge.id, badge);
                        // Using Notification instead of Alert for celebration
                        window.StopIt.Utils.Notifications.show(`🏆 Nuovo Badge: ${badge.name}`, 'success', 5000);
                    }
                }
            } catch (error) {
                console.error('Error checking badges:', error);
            }
        }
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        window.stopItApp = new App();
        window.stopItApp.init();
    });
})();
