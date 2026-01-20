/**
 * Database Module - IndexedDB wrapper with encryption support
 * All user data is stored locally and encrypted with user's password
 */

(function () {
    const DB_NAME = 'StopItDB';
    const DB_VERSION = 1;

    const STORES = {
        USERS: 'users',           // User credentials (username + hashed password)
        USER_DATA: 'user_data',   // Encrypted user profile data
        LOGS: 'logs',             // Encrypted craving logs
        BADGES: 'badges',         // Encrypted badge progress
        PLANS: 'plans',           // Encrypted if-then plans
        PREFERENCES: 'preferences' // Encrypted user preferences
    };

    let dbInstance = null;

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('❌ Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                dbInstance = request.result;
                console.log('✅ Database initialized');
                resolve(dbInstance);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔧 Upgrading database...');

                // Users store (username is NOT encrypted, password is hashed)
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'username' });
                    usersStore.createIndex('username', 'username', { unique: true });
                }

                // User data store (encrypted with user password)
                if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
                    db.createObjectStore(STORES.USER_DATA, { keyPath: 'username' });
                }

                // Logs store (encrypted)
                if (!db.objectStoreNames.contains(STORES.LOGS)) {
                    const logsStore = db.createObjectStore(STORES.LOGS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    logsStore.createIndex('username', 'username', { unique: false });
                    logsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Badges store (encrypted)
                if (!db.objectStoreNames.contains(STORES.BADGES)) {
                    const badgesStore = db.createObjectStore(STORES.BADGES, { keyPath: 'id' });
                    badgesStore.createIndex('username', 'username', { unique: false });
                }

                // Plans store (encrypted)
                if (!db.objectStoreNames.contains(STORES.PLANS)) {
                    const plansStore = db.createObjectStore(STORES.PLANS, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    plansStore.createIndex('username', 'username', { unique: false });
                }

                // Preferences store (encrypted)
                if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
                    db.createObjectStore(STORES.PREFERENCES, { keyPath: 'username' });
                }
            };
        });
    }

    async function runTransaction(storeName, mode, callback) {
        if (!dbInstance) {
            await initDB();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = dbInstance.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                const request = callback(store);

                transaction.oncomplete = () => {
                    resolve(request?.result);
                };

                transaction.onerror = () => {
                    console.error('Transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    window.StopIt.DB = {
        init: initDB,

        // ========== USER METHODS ==========
        createUser: async function (username, hashedPassword, salt) {
            return runTransaction(STORES.USERS, 'readwrite', (store) => {
                return store.add({
                    username,
                    hashedPassword,
                    salt,
                    createdAt: new Date().toISOString()
                });
            });
        },

        getUser: async function (username) {
            return runTransaction(STORES.USERS, 'readonly', (store) => {
                return store.get(username);
            });
        },

        userExists: async function (username) {
            const user = await this.getUser(username);
            return !!user;
        },

        // ========== USER DATA METHODS ==========
        saveUserData: async function (username, encryptedData) {
            return runTransaction(STORES.USER_DATA, 'readwrite', (store) => {
                return store.put({
                    username,
                    data: encryptedData,
                    updatedAt: new Date().toISOString()
                });
            });
        },

        getUserData: async function (username) {
            return runTransaction(STORES.USER_DATA, 'readonly', (store) => {
                return store.get(username);
            });
        },

        // ========== LOGS METHODS ==========
        addLog: async function (username, encryptedLog) {
            return runTransaction(STORES.LOGS, 'readwrite', (store) => {
                return store.add({
                    username,
                    data: encryptedLog,
                    timestamp: new Date().toISOString()
                });
            });
        },

        getUserLogs: async function (username) {
            return new Promise((resolve, reject) => {
                runTransaction(STORES.LOGS, 'readonly', (store) => {
                    const index = store.index('username');
                    return index.getAll(username);
                }).then(resolve).catch(reject);
            });
        },

        deleteLog: async function (logId) {
            return runTransaction(STORES.LOGS, 'readwrite', (store) => {
                return store.delete(logId);
            });
        },

        // ========== BADGES METHODS ==========
        saveBadge: async function (username, badgeId, encryptedData) {
            return runTransaction(STORES.BADGES, 'readwrite', (store) => {
                return store.put({
                    id: `${username}_${badgeId}`,
                    username,
                    badgeId,
                    data: encryptedData,
                    unlockedAt: new Date().toISOString()
                });
            });
        },

        getUserBadges: async function (username) {
            return new Promise((resolve, reject) => {
                runTransaction(STORES.BADGES, 'readonly', (store) => {
                    const index = store.index('username');
                    return index.getAll(username);
                }).then(resolve).catch(reject);
            });
        },

        // ========== PLANS METHODS ==========
        addPlan: async function (username, encryptedPlan) {
            return runTransaction(STORES.PLANS, 'readwrite', (store) => {
                return store.add({
                    username,
                    data: encryptedPlan,
                    createdAt: new Date().toISOString()
                });
            });
        },

        getUserPlans: async function (username) {
            return new Promise((resolve, reject) => {
                runTransaction(STORES.PLANS, 'readonly', (store) => {
                    const index = store.index('username');
                    return index.getAll(username);
                }).then(resolve).catch(reject);
            });
        },

        deletePlan: async function (planId) {
            return runTransaction(STORES.PLANS, 'readwrite', (store) => {
                return store.delete(planId);
            });
        },

        // ========== PREFERENCES METHODS ==========
        savePreferences: async function (username, encryptedPrefs) {
            return runTransaction(STORES.PREFERENCES, 'readwrite', (store) => {
                return store.put({
                    username,
                    data: encryptedPrefs,
                    updatedAt: new Date().toISOString()
                });
            });
        },

        getPreferences: async function (username) {
            return runTransaction(STORES.PREFERENCES, 'readonly', (store) => {
                return store.get(username);
            });
        },

        // ========== UTILITY METHODS ==========
        deleteUserData: async function (username) {
            const stores = [
                STORES.USER_DATA,
                STORES.LOGS,
                STORES.BADGES,
                STORES.PLANS,
                STORES.PREFERENCES
            ];

            for (const storeName of stores) {
                await runTransaction(storeName, 'readwrite', (store) => {
                    const index = store.index('username');
                    const request = index.openCursor(IDBKeyRange.only(username));

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            cursor.delete();
                            cursor.continue();
                        }
                    };

                    return request;
                });
            }

            // Also delete user credentials
            await runTransaction(STORES.USERS, 'readwrite', (store) => {
                return store.delete(username);
            });
        },

        clearAll: async function () {
            return new Promise((resolve, reject) => {
                if (dbInstance) {
                    dbInstance.close();
                }

                const request = indexedDB.deleteDatabase(DB_NAME);

                request.onsuccess = () => {
                    console.log('✅ Database cleared');
                    dbInstance = null;
                    resolve();
                };

                request.onerror = () => {
                    console.error('❌ Failed to clear database');
                    reject(request.error);
                };
            });
        }
    };
})();
