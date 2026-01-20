/**
 * Calculations Module
 * Health and financial calculations
 */

(function () {
    window.StopIt.Utils.Calculations = {
        /**
         * Calculate days smoke-free
         */
        calculateDaysSmokeFree: function (quitDate) {
            if (!quitDate) return 0;
            const quit = new Date(quitDate);
            const now = new Date();
            const diffTime = Math.abs(now - quit);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        },

        /**
         * Calculate cigarettes avoided
         */
        calculateCigarettesAvoided: function (quitDate, cigarettesPerDay) {
            const days = this.calculateDaysSmokeFree(quitDate);
            return Math.floor(days * cigarettesPerDay);
        },

        /**
         * Calculate money saved
         */
        calculateMoneySaved: function (quitDate, cigarettesPerDay, costPerPack, cigarettesPerPack = 20) {
            const cigarettesAvoided = this.calculateCigarettesAvoided(quitDate, cigarettesPerDay);
            const packsAvoided = cigarettesAvoided / cigarettesPerPack;
            return Math.floor(packsAvoided * costPerPack * 100) / 100;
        },

        /**
         * Calculate life time gained
         */
        calculateLifeTimeGained: function (quitDate, cigarettesPerDay) {
            const cigarettesAvoided = this.calculateCigarettesAvoided(quitDate, cigarettesPerDay);
            const minutesGained = cigarettesAvoided * 11;

            return {
                minutes: minutesGained,
                hours: Math.floor(minutesGained / 60),
                days: Math.floor(minutesGained / (60 * 24)),
                formatted: this.formatLifeTime(minutesGained)
            };
        },

        formatLifeTime: function (minutes) {
            const days = Math.floor(minutes / (60 * 24));
            const hours = Math.floor((minutes % (60 * 24)) / 60);
            const mins = Math.floor(minutes % 60);

            if (days > 0) {
                return `${days}g ${hours}h`;
            } else if (hours > 0) {
                return `${hours}h ${mins}m`;
            } else {
                return `${mins}m`;
            }
        },

        calculateStreak: function (quitDate, relapses = []) {
            if (!quitDate) return 0;

            if (relapses.length > 0) {
                const lastRelapse = relapses.sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                )[0];

                const lastRelapseDate = new Date(lastRelapse.date);
                const now = new Date();
                const diffTime = Math.abs(now - lastRelapseDate);
                return Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            return this.calculateDaysSmokeFree(quitDate);
        },

        projectFutureSavings: function (cigarettesPerDay, costPerPack, cigarettesPerPack = 20) {
            // Guard clauses for null/undefined values
            if (!cigarettesPerDay || !costPerPack) {
                return { weekly: 0, monthly: 0, yearly: 0 };
            }

            const dailyCost = (cigarettesPerDay / cigarettesPerPack) * costPerPack;
            return {
                weekly: dailyCost * 7,
                monthly: dailyCost * 30,
                yearly: dailyCost * 365
            };
        },

        formatCurrency: function (amount, currency = 'CHF') {
            if (amount === null || amount === undefined || isNaN(amount)) {
                return `0.00 ${currency}`;
            }
            return `${Number(amount).toFixed(2)} ${currency}`;
        }
    };
})();
