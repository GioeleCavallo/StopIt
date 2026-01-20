/**
 * Calendar View
 * Shows streak flame and monthly calendar with smoke-free days
 */

(function () {
    window.StopIt.Views.CalendarView = class CalendarView {
        constructor() {
            this.currentDate = new Date();
        }

        async render(container) {
            const userData = window.StopIt.State.getUserData();
            const logs = window.StopIt.State.getLogs();
            const relapses = logs.filter(l => l.outcome === 'relapse');

            // Calculate Streak
            // Logic: Days since last relapse OR quit date if no relapse
            // We use Calculations utility if compatible, or custom logic here ensuring 00:00 precision
            const lastRelapseLog = relapses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            const lastEventDate = lastRelapseLog ? new Date(lastRelapseLog.timestamp) : new Date(userData.quitDate);

            const now = new Date();
            const diffTime = Math.abs(now - lastEventDate);
            const streakDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            container.innerHTML = `
                <div class="calendar-view fade-in">
                    <!-- Flame Header -->
                    <div class="flame-header text-center mb-xl">
                        <div class="flame-container pulse-animation">
                            <svg viewBox="0 0 100 100" class="flame-icon">
                                <path fill="#FF6B6B" d="M50 0 C20 40 10 50 10 70 C10 90 30 100 50 100 C70 100 90 90 90 70 C90 50 80 40 50 0 Z" />
                                <path fill="#FF9F43" d="M50 20 C30 50 25 60 25 75 C25 90 35 95 50 95 C65 95 75 90 75 75 C75 60 70 50 50 20 Z" />
                                <text x="50" y="70" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${streakDays}</text>
                            </svg>
                        </div>
                        <h2 class="mt-md">La tua serie</h2>
                        <p class="text-secondary text-sm mt-xs">
                            Hai perso un giorno? 😢 <br>
                            Per recuperare la tua serie, tocca il giorno perso.
                        </p>
                    </div>

                    <!-- Calendar Grid -->
                    <div class="calendar-card card">
                        <div class="calendar-nav flex-between mb-md">
                            <button id="prev-month" class="btn-icon">‹</button>
                            <h3 id="current-month-label">${this.getMonthLabel(this.currentDate)}</h3>
                            <button id="next-month" class="btn-icon">›</button>
                        </div>

                        <div class="calendar-grid">
                            <div class="day-header">LUN</div>
                            <div class="day-header">MAR</div>
                            <div class="day-header">MER</div>
                            <div class="day-header">GIO</div>
                            <div class="day-header">VEN</div>
                            <div class="day-header">SAB</div>
                            <div class="day-header">DOM</div>
                            
                            <div id="days-container" class="days-container">
                                <!-- Days injected by JS -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.renderDays(container.querySelector('#days-container'), userData.quitDate, relapses);
            this.attachEventListeners(container, userData.quitDate, relapses);
        }

        getMonthLabel(date) {
            return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        }

        renderDays(container, quitDateStr, relapses) {
            container.innerHTML = '';
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Adjust for Monday start (0=Sun, 1=Mon)
            let startDay = firstDay.getDay() - 1;
            if (startDay === -1) startDay = 6;

            const totalDays = lastDay.getDate();
            const quitDate = new Date(quitDateStr);
            const today = new Date();

            // Empty slots for previous month
            for (let i = 0; i < startDay; i++) {
                container.appendChild(this.createDayElement(''));
            }

            // Days
            for (let day = 1; day <= totalDays; day++) {
                const dayDate = new Date(year, month, day);
                const dayStr = dayDate.toISOString().split('T')[0];

                let state = 'future';
                let isToday = dayDate.toDateString() === today.toDateString();

                if (dayDate > today) {
                    state = 'future';
                } else if (dayDate < quitDate) {
                    state = 'pre-quit'; // Before starting
                } else {
                    // Check for relapses on this day
                    const hasRelapse = relapses.some(r => r.timestamp.startsWith(dayStr));
                    if (hasRelapse) {
                        state = 'relapse';
                    } else {
                        state = 'smoke-free';
                    }
                }

                container.appendChild(this.createDayElement(day, state, isToday));
            }
        }

        createDayElement(dayNumber, state, isToday) {
            const div = document.createElement('div');
            div.className = `day-cell ${state} ${isToday ? 'today' : ''}`;

            if (!dayNumber) return div; // Empty slot

            if (state === 'smoke-free') {
                div.innerHTML = `<span class="day-number">${dayNumber}</span>`;
            } else if (state === 'relapse') {
                div.innerHTML = `<span class="relapse-icon">🕸️</span>`;
            } else if (state === 'pre-quit') {
                div.innerHTML = `<span class="day-number text-muted">${dayNumber}</span>`;
            } else {
                div.innerHTML = `<span class="day-number">${dayNumber}</span>`;
            }

            return div;
        }

        attachEventListeners(container, quitDateStr, relapses) {
            container.querySelector('#prev-month').addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                container.querySelector('#current-month-label').innerText = this.getMonthLabel(this.currentDate);
                this.renderDays(container.querySelector('#days-container'), quitDateStr, relapses);
            });

            container.querySelector('#next-month').addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                container.querySelector('#current-month-label').innerText = this.getMonthLabel(this.currentDate);
                this.renderDays(container.querySelector('#days-container'), quitDateStr, relapses);
            });
        }
    };
})();
