/**
 * State Management Module
 * Manages global application state and user data
 */

(function () {
    let userData = null;
    let logs = [];
    let badges = [];
    let plans = [];
    let preferences = null;
    const listeners = new Map();

    // Helper: Default User Data
    function getDefaultUserData() {
        return {
            age: null,
            yearsSmoked: null,
            cigarettesPerDay: null,
            costPerPack: null,
            cigarettesPerPack: 20,
            quitDate: null,
            motivation: '',
            triggers: [],
            partnerPhone: null,
            trackCycle: false,
            onboardingCompleted: false
        };
    }

    // Helper: Default Preferences
    function getDefaultPreferences() {
        return {
            shareCardShowMoney: true,
            shareCardShowTime: true,
            shareCardShowStreak: true,
            notificationsEnabled: false,
            reminderBackup: true,
            theme: 'light'
        };
    }

    window.StopIt.State = {
        /**
         * Initialize user data from database
         */
        loadUserData: async function () {
            try {
                if (!window.StopIt.Auth.isAuthenticated()) {
                    throw new Error('User not authenticated');
                }

                const username = window.StopIt.Auth.getCurrentUser();

                // Load user profile data
                const userDataRecord = await window.StopIt.DB.getUserData(username);
                if (userDataRecord?.data) {
                    userData = await window.StopIt.Auth.decryptData(userDataRecord.data);
                } else {
                    userData = getDefaultUserData();
                }

                // Load logs
                const logsRecords = await window.StopIt.DB.getUserLogs(username);
                logs = await Promise.all(
                    logsRecords.map(async (record) => ({
                        id: record.id,
                        timestamp: record.timestamp,
                        ...await window.StopIt.Auth.decryptData(record.data)
                    }))
                );

                // Load badges
                const badgesRecords = await window.StopIt.DB.getUserBadges(username);
                badges = await Promise.all(
                    badgesRecords.map(async (record) => ({
                        id: record.badgeId,
                        unlockedAt: record.unlockedAt,
                        ...await window.StopIt.Auth.decryptData(record.data)
                    }))
                );

                // Load plans
                const plansRecords = await window.StopIt.DB.getUserPlans(username);
                plans = await Promise.all(
                    plansRecords.map(async (record) => ({
                        id: record.id,
                        createdAt: record.createdAt,
                        ...await window.StopIt.Auth.decryptData(record.data)
                    }))
                );

                // Load preferences
                const prefsRecord = await window.StopIt.DB.getPreferences(username);
                if (prefsRecord?.data) {
                    preferences = await window.StopIt.Auth.decryptData(prefsRecord.data);
                } else {
                    preferences = getDefaultPreferences();
                }

                console.log('✅ User data loaded');
                this.notifyListeners('dataLoaded');
            } catch (error) {
                console.error('❌ Error loading user data:', error);
                throw error;
            }
        },

        /**
         * Save user profile data
         */
        saveUserData: async function (data) {
            try {
                userData = { ...userData, ...data };
                const encrypted = await window.StopIt.Auth.encryptData(userData);
                await window.StopIt.DB.saveUserData(window.StopIt.Auth.getCurrentUser(), encrypted);
                this.notifyListeners('userDataUpdated');
                console.log('✅ User data saved');
            } catch (error) {
                console.error('❌ Error saving user data:', error);
                throw error;
            }
        },

        /**
         * Add a craving log
         */
        addLog: async function (logData) {
            try {
                const encrypted = await window.StopIt.Auth.encryptData(logData);
                const id = await window.StopIt.DB.addLog(window.StopIt.Auth.getCurrentUser(), encrypted);

                const newLog = {
                    id,
                    timestamp: new Date().toISOString(),
                    ...logData
                };

                logs.push(newLog);
                this.notifyListeners('logAdded', newLog);
                console.log('✅ Log added');
                return newLog;
            } catch (error) {
                console.error('❌ Error adding log:', error);
                throw error;
            }
        },

        getLogs: function () {
            return logs.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );
        },

        deleteLog: async function (logId) {
            try {
                await window.StopIt.DB.deleteLog(logId);
                logs = logs.filter(log => log.id !== logId);
                this.notifyListeners('logDeleted', logId);
                console.log('✅ Log deleted');
            } catch (error) {
                console.error('❌ Error deleting log:', error);
                throw error;
            }
        },

        unlockBadge: async function (badgeId, badgeData) {
            try {
                if (badges.some(b => b.id === badgeId)) {
                    return false;
                }

                const encrypted = await window.StopIt.Auth.encryptData(badgeData);
                await window.StopIt.DB.saveBadge(window.StopIt.Auth.getCurrentUser(), badgeId, encrypted);

                const newBadge = {
                    id: badgeId,
                    unlockedAt: new Date().toISOString(),
                    ...badgeData
                };

                badges.push(newBadge);
                this.notifyListeners('badgeUnlocked', newBadge);
                console.log('✅ Badge unlocked:', badgeId);
                return true;
            } catch (error) {
                console.error('❌ Error unlocking badge:', error);
                throw error;
            }
        },

        getBadges: function () {
            return badges;
        },

        isBadgeUnlocked: function (badgeId) {
            return badges.some(b => b.id === badgeId);
        },

        addPlan: async function (planData) {
            try {
                const encrypted = await window.StopIt.Auth.encryptData(planData);
                const id = await window.StopIt.DB.addPlan(window.StopIt.Auth.getCurrentUser(), encrypted);

                const newPlan = {
                    id,
                    createdAt: new Date().toISOString(),
                    ...planData
                };

                plans.push(newPlan);
                this.notifyListeners('planAdded', newPlan);
                console.log('✅ Plan added');
                return newPlan;
            } catch (error) {
                console.error('❌ Error adding plan:', error);
                throw error;
            }
        },

        getPlans: function () {
            return plans;
        },

        deletePlan: async function (planId) {
            try {
                await window.StopIt.DB.deletePlan(planId);
                plans = plans.filter(plan => plan.id !== planId);
                this.notifyListeners('planDeleted', planId);
                console.log('✅ Plan deleted');
            } catch (error) {
                console.error('❌ Error deleting plan:', error);
                throw error;
            }
        },

        savePreferences: async function (prefs) {
            try {
                preferences = { ...preferences, ...prefs };
                const encrypted = await window.StopIt.Auth.encryptData(preferences);
                await window.StopIt.DB.savePreferences(window.StopIt.Auth.getCurrentUser(), encrypted);
                this.notifyListeners('preferencesUpdated');
                console.log('✅ Preferences saved');
            } catch (error) {
                console.error('❌ Error saving preferences:', error);
                throw error;
            }
        },

        getPreferences: function () {
            return preferences;
        },

        getUserData: function () {
            return userData;
        },

        subscribe: function (event, callback) {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
            return () => {
                const callbacks = listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            };
        },

        overwriteBadges: async function (newBadgesList) {
            try {
                // Delete all current badges for user from DB
                // Since indexedDB delete by range might be complex without a helper,
                // and we don't have a 'deleteAllBadges' in DB.js yet,
                // we'll iterate. Efficient enough for < 50 badges.
                const username = window.StopIt.Auth.getCurrentUser();

                // Note: Better approach would be to have a bulk update in DB, 
                // but we must work with existing tools.
                // Or simply: We assume the DB.saveBadge overwrites if key exists?
                // Actually badges in DB are stored by composite key?
                // Let's check DB.js, but assuming standard KeyPath autoincrement or [user+badgeId].
                // If we want to REMOVE a badge, we physically need to delete it.

                // For simplicity and safety in this context:
                // We will implement a 'syncBadges' which essentially removes those not in list.

                // Actually, let's just delete ALL badges locally and re-save the good ones? 
                // Risky if encryption fails mid-way.

                // Better: Calculate diff (Already done in App checkRevocation).
                // We receive the 'good' list.
                // We need to delete from DB those that are NOT in newBadgesList but ARE in 'badges' (current state).

                const currentIds = badges.map(b => b.id);
                const newIds = newBadgesList.map(b => b.id);
                const toDelete = currentIds.filter(id => !newIds.includes(id));

                for (const badgeId of toDelete) {
                    await window.StopIt.DB.deleteBadge(username, badgeId);
                }

                // Update local state
                badges = [...newBadgesList];
                this.notifyListeners('badgesUpdated', badges);
                console.log('✅ Badges overwritten/synced');
            } catch (error) {
                console.error('❌ Error overwriting badges:', error);
                throw error;
            }
        },

        notifyListeners: function (event, data) {
            if (listeners.has(event)) {
                listeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('Error in listener:', error);
                    }
                });
            }
        },

        clear: function () {
            userData = null;
            logs = [];
            badges = [];
            plans = [];
            preferences = null;
            listeners.clear();
        }
    };
})();
