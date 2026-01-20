/**
 * Badges Engine
 */

(function () {
    // Badge definitions
    const BADGE_CATALOG = {
        // --- 1. Streak & Tempo ---
        '24h_freedom': {
            id: '24h_freedom',
            name: '24 Ore di Libertà',
            description: 'Hai completato il primo giorno intero senza fumo!',
            icon: '🌅',
            category: 'streak',
            checkUnlock: (userData) => window.StopIt.Utils.Calculations.calculateDaysSmokeFree(userData.quitDate) >= 1
        },
        '3d_fire': {
            id: '3d_fire',
            name: '3 Giorni di Fuoco',
            description: 'Hai superato il picco dell\'astinenza fisica.',
            icon: '🔥',
            category: 'streak',
            checkUnlock: (userData) => window.StopIt.Utils.Calculations.calculateDaysSmokeFree(userData.quitDate) >= 3
        },
        'week_clean': {
            id: 'week_clean',
            name: 'Una Settimana Pulita',
            description: 'Una settimana intera! Il peggio è passato.',
            icon: '📅',
            category: 'streak',
            checkUnlock: (userData) => window.StopIt.Utils.Calculations.calculateDaysSmokeFree(userData.quitDate) >= 7
        },
        'month_master': {
            id: 'month_master',
            name: 'Maestro del Mese',
            description: '30 giorni di nuova vita.',
            icon: '👑',
            category: 'streak',
            checkUnlock: (userData) => window.StopIt.Utils.Calculations.calculateDaysSmokeFree(userData.quitDate) >= 30
        },

        // --- 2. Risparmio ---
        'piggy_starter': {
            id: 'piggy_starter',
            name: 'Salvadanaio Principiante',
            description: 'Hai risparmiato i primi 10 CHF/EUR.',
            icon: '🐷',
            category: 'savings',
            checkUnlock: (userData, logs, plans, calcMoney) => calcMoney(userData) >= 10
        },
        'shopping_therapy': {
            id: 'shopping_therapy',
            name: 'Shopping Therapy',
            description: 'Hai risparmiato abbastanza per comprarti un vestito nuovo (50+).',
            icon: '🛍️',
            category: 'savings',
            checkUnlock: (userData, logs, plans, calcMoney) => calcMoney(userData) >= 50
        },
        'investor': {
            id: 'investor',
            name: 'Investitore',
            description: 'Wow! Hai risparmiato una cifra seria (200+).',
            icon: '📈',
            category: 'savings',
            checkUnlock: (userData, logs, plans, calcMoney) => calcMoney(userData) >= 200
        },

        // --- 3. Relationship ---
        'romantic_dinner': {
            id: 'romantic_dinner',
            name: 'Cena Romantica',
            description: 'Hai risparmiato abbastanza per offrire una cena a due (80+).',
            icon: '🥂',
            category: 'relationship',
            checkUnlock: (userData, logs, plans, calcMoney) => calcMoney(userData) >= 80
        },
        'weekend_love': {
            id: 'weekend_love',
            name: 'Weekend d\'Amore',
            description: 'Risparmio sufficiente per un weekend fuori porta (300+).',
            icon: '✈️',
            category: 'relationship',
            checkUnlock: (userData, logs, plans, calcMoney) => calcMoney(userData) >= 300
        },
        'partner_sos': {
            id: 'partner_sos',
            name: 'Partner Orgoglioso',
            description: 'Hai resistito a una voglia grazie all\'aiuto del partner.',
            icon: '🤝',
            category: 'relationship',
            checkUnlock: (userData, logs) => logs.some(l => l.strategies && l.strategies.includes('partner') && l.outcome === 'resisted')
        },

        // --- 4. Salute ---
        'breath_deep': {
            id: 'breath_deep',
            name: 'Respiro Profondo',
            description: '12 ore senza fumo: CO nel sangue normalizzato.',
            icon: '🫁',
            category: 'health',
            checkUnlock: (userData) => {
                const hours = (new Date() - new Date(userData.quitDate)) / (1000 * 60 * 60);
                return hours >= 12;
            }
        },
        'taste_back': {
            id: 'taste_back',
            name: 'Gusto Ritrovato',
            description: '48 ore: Gusto e olfatto migliorati.',
            icon: '👃',
            category: 'health',
            checkUnlock: (userData) => {
                const hours = (new Date() - new Date(userData.quitDate)) / (1000 * 60 * 60);
                return hours >= 48;
            }
        },
        'heart_light': {
            id: 'heart_light',
            name: 'Cuore Leggero',
            description: '2 settimane: Circolazione migliorata.',
            icon: '❤️',
            category: 'health',
            checkUnlock: (userData) => window.StopIt.Utils.Calculations.calculateDaysSmokeFree(userData.quitDate) >= 14
        },

        // --- 5. Resilienza & Comportamento ---
        'phoenix': {
            id: 'phoenix',
            name: 'Fenice',
            description: 'Hai avuto una ricaduta ma sei ripartita subito (24h clean post-relapse).',
            icon: '🦅',
            category: 'resilience',
            checkUnlock: (userData, logs) => {
                const relapses = logs.filter(l => l.outcome === 'relapse');
                if (relapses.length === 0) return false;
                const lastRelapse = new Date(relapses[relapses.length - 1].date || relapses[relapses.length - 1].timestamp);
                const hoursSince = (new Date() - lastRelapse) / (1000 * 60 * 60);
                return hoursSince >= 24;
            }
        },
        'honesty': {
            id: 'honesty',
            name: 'Onestà Brutale',
            description: 'Hai avuto il coraggio di loggare una sigaretta fumata.',
            icon: '⚖️',
            category: 'resilience',
            checkUnlock: (userData, logs) => logs.some(l => l.outcome === 'relapse')
        },
        'trigger_hunter': {
            id: 'trigger_hunter',
            name: 'Cacciatore di Trigger',
            description: 'Hai registrato 10 voglie identificando il trigger.',
            icon: '⚡',
            category: 'awareness',
            checkUnlock: (userData, logs) => logs.filter(l => l.triggers && l.triggers.length > 0).length >= 10
        },
        'plan_ready': {
            id: 'plan_ready',
            name: 'Piano d\'Emergenza',
            description: 'Ti sei preparata con un piano "Se-Allora".',
            icon: '🛡️',
            category: 'action',
            checkUnlock: (userData, logs, plans) => plans && plans.length > 0
        }
    };

    // List of badges that are lost on relapse
    const REVOCABLE_BADGES = [
        '24h_freedom', '3d_fire', 'week_clean', 'month_master',
        'breath_deep', 'taste_back', 'heart_light'
    ];

    window.StopIt.Utils.BadgesEngine = {
        checkBadges: function (userData, logs, plans, unlockedBadges) {
            const newlyUnlocked = [];
            const calcMoney = (u) => window.StopIt.Utils.Calculations.calculateMoneySaved(u.quitDate, u.cigarettesPerDay, u.costPerPack, u.cigarettesPerPack);

            Object.values(BADGE_CATALOG).forEach(badge => {
                if (unlockedBadges.some(b => b.id === badge.id)) return;

                try {
                    if (badge.checkUnlock(userData, logs, plans, calcMoney)) {
                        newlyUnlocked.push({
                            ...badge,
                            unlockedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Error checking badge ${badge.id}:`, error);
                }
            });

            return newlyUnlocked;
        },

        checkRevocation: function (logs, unlockedBadges) {
            // If latest log is a relapse, we might need to revoke badges
            // However, badges are usually earned based on *current* status.
            // If we reset the quitDate, the 'streak' badges will naturally stay if logic depends on historical data,
            // but requirements say "remove them".

            // Simpler approach: Return list of badge IDs that should be removed
            // The caller (App.js) will handle the DB update.

            const lastLog = logs[0]; // Assuming sorted new to old
            if (!lastLog || lastLog.outcome !== 'relapse') return [];

            // If we just relapsed, we lose all streak and health badges (revocable ones)
            // Filter out badges that serve as 'historical records' if any (e.g. 'honesty').

            // Find which owned badges are in the revocable list
            const badgesToRevoke = unlockedBadges
                .filter(b => REVOCABLE_BADGES.includes(b.id))
                .map(b => b.id);

            return badgesToRevoke;
        },

        getBadgeById: function (badgeId) {
            return BADGE_CATALOG[badgeId];
        },


        getAllBadges: function () {
            return Object.values(BADGE_CATALOG);
        },

        getBadgeCategories: function () {
            return [
                { id: 'all', name: 'Tutti', icon: '⭐' },
                { id: 'streak', name: 'Streak', icon: '🔥' },
                { id: 'savings', name: 'Risparmio', icon: '💰' },
                { id: 'relationship', name: 'Coppia', icon: '💕' },
                { id: 'health', name: 'Salute', icon: '❤️' },
                { id: 'resilience', name: 'Resilienza', icon: '💪' },
                { id: 'awareness', name: 'Consapevolezza', icon: '🧠' },
                { id: 'action', name: 'Azione', icon: '⚡' }
            ];
        }
    };
})();
