/**
 * Authentication Module
 * Handles user registration, login, and session management
 */

(function () {
    let currentUser = null;
    let currentPassword = null;
    let currentSalt = null;

    window.StopIt.Auth = {
        /**
         * Register a new user
         */
        register: async function (username, password) {
            try {
                // Validate input
                if (!username || username.trim().length < 3) {
                    throw new Error('Il nome utente deve essere di almeno 3 caratteri');
                }

                if (!password || password.length < 8) {
                    throw new Error('La password deve essere di almeno 8 caratteri');
                }

                // Check if user already exists
                const exists = await window.StopIt.DB.userExists(username.trim());
                if (exists) {
                    throw new Error('Questo nome utente è già in uso');
                }

                // Generate salt and hash password
                const salt = window.StopIt.CryptoService.generateSalt();
                const hashedPassword = await window.StopIt.CryptoService.hashPassword(password, salt);

                // Create user in database
                await window.StopIt.DB.createUser(
                    username.trim(),
                    hashedPassword,
                    window.StopIt.CryptoService.saltToBase64(salt)
                );

                console.log('✅ User registered:', username);

                // Auto-login after registration
                return this.login(username, password);
            } catch (error) {
                console.error('❌ Registration error:', error);
                throw error;
            }
        },

        /**
         * Login user
         */
        login: async function (username, password) {
            try {
                // Get user from database
                const user = await window.StopIt.DB.getUser(username.trim());

                if (!user) {
                    throw new Error('Nome utente o password non corretti');
                }

                // Convert salt back to Uint8Array
                const salt = window.StopIt.CryptoService.base64ToSalt(user.salt);

                // Verify password
                const isValid = await window.StopIt.CryptoService.verifyPassword(
                    password,
                    user.hashedPassword,
                    salt
                );

                if (!isValid) {
                    throw new Error('Nome utente o password non corretti');
                }

                // Set current user session
                currentUser = username.trim();
                currentPassword = password;
                currentSalt = salt;

                // Store session in sessionStorage (not password, just username)
                sessionStorage.setItem('currentUser', currentUser);

                console.log('✅ User logged in:', username);

                return {
                    username: currentUser,
                    createdAt: user.createdAt
                };
            } catch (error) {
                console.error('❌ Login error:', error);
                throw error;
            }
        },

        /**
         * Logout user
         */
        logout: function () {
            currentUser = null;
            currentPassword = null;
            currentSalt = null;
            sessionStorage.removeItem('currentUser');
            console.log('✅ User logged out');
        },

        /**
         * Check if user is logged in
         */
        isAuthenticated: function () {
            return currentUser !== null && currentPassword !== null;
        },

        /**
         * Get current user
         */
        getCurrentUser: function () {
            return currentUser;
        },

        /**
         * Check if there's a session (but password not in memory)
         */
        hasSession: function () {
            return sessionStorage.getItem('currentUser') !== null;
        },

        /**
         * Get session username (without password)
         */
        getSessionUsername: function () {
            return sessionStorage.getItem('currentUser');
        },

        /**
         * Encrypt data for current user
         */
        encryptData: async function (data) {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            return window.StopIt.CryptoService.encrypt(data, currentPassword, currentSalt);
        },

        /**
         * Decrypt data for current user
         */
        decryptData: async function (encryptedData) {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            return window.StopIt.CryptoService.decrypt(encryptedData, currentPassword, currentSalt);
        },

        /**
         * Export all user data (decrypted)
         */
        exportData: async function () {
            try {
                if (!this.isAuthenticated()) {
                    throw new Error('User not authenticated');
                }

                const userData = await window.StopIt.DB.getUserData(currentUser);
                const logs = await window.StopIt.DB.getUserLogs(currentUser);
                const badges = await window.StopIt.DB.getUserBadges(currentUser);
                const plans = await window.StopIt.DB.getUserPlans(currentUser);
                const prefs = await window.StopIt.DB.getPreferences(currentUser);

                const exportData = {
                    username: currentUser,
                    exportedAt: new Date().toISOString(),
                    data: {}
                };

                if (userData?.data) {
                    exportData.data.profile = await this.decryptData(userData.data);
                }

                if (logs?.length > 0) {
                    exportData.data.logs = await Promise.all(
                        logs.map(async (log) => ({
                            id: log.id,
                            timestamp: log.timestamp,
                            ...await this.decryptData(log.data)
                        }))
                    );
                }

                if (badges?.length > 0) {
                    exportData.data.badges = await Promise.all(
                        badges.map(async (badge) => ({
                            id: badge.badgeId,
                            unlockedAt: badge.unlockedAt,
                            ...await this.decryptData(badge.data)
                        }))
                    );
                }

                if (plans?.length > 0) {
                    exportData.data.plans = await Promise.all(
                        plans.map(async (plan) => ({
                            id: plan.id,
                            createdAt: plan.createdAt,
                            ...await this.decryptData(plan.data)
                        }))
                    );
                }

                if (prefs?.data) {
                    exportData.data.preferences = await this.decryptData(prefs.data);
                }

                return exportData;
            } catch (error) {
                console.error('❌ Export error:', error);
                throw error;
            }
        }
    };
})();
