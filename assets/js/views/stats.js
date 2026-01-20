/**
 * Stats View
 * Shows charts and detailed statistics
 */

(function () {
    window.StopIt.Views.StatsView = class StatsView {
        async render(container) {
            const userData = window.StopIt.State.getUserData();
            const logs = window.StopIt.State.getLogs();
            const Calcs = window.StopIt.Utils.Calculations;

            // Trigger Analysis (Weighted Risk Score)
            /* 
               Score = Sum of (Frequency * IntensityWeight)
               Intensity: 1=0.25, 2=0.5, 3=0.75, 4=1.0
               Then categorize by Trigger ID.
            */
            const triggerScores = {};

            logs.forEach(log => {
                if (log.triggers && log.triggers.length > 0) {
                    const intensity = log.intensity || 2; // Default medium if missing
                    let weight = 0.5;
                    if (intensity === 1) weight = 0.25;
                    if (intensity === 2) weight = 0.5;
                    if (intensity === 3) weight = 0.75;
                    if (intensity === 4) weight = 1.0;

                    // Distribute weight among triggers if multiple? 
                    // Requirement says: "Assign to the craving an incremental score... multiply by number of times".
                    // If a craving has 2 triggers, both contributed. Full weight to both? Or split?
                    // "Multiplica questi coefficienti per il numero di volte" suggests Sum(Weight).
                    // We'll Assign full weight to each trigger present in that event.

                    log.triggers.forEach(t => {
                        triggerScores[t] = (triggerScores[t] || 0) + weight;
                    });
                }
            });

            const topTriggers = Object.entries(triggerScores)
                .sort((a, b) => b[1] - a[1]) // Sort by Score DESC
                .slice(0, 3);

            // Medals for ranking
            const medals = ['🥇', '🥈', '🥉'];

            // Money Projection
            const savings = Calcs.projectFutureSavings(
                userData.cigarettesPerDay,
                userData.costPerPack,
                userData.cigarettesPerPack
            );
            const totalSaved = Calcs.calculateMoneySaved(userData.quitDate, userData.costPerPack, userData.cigarettesPerDay, userData.cigarettesPerPack);

            container.innerHTML = `
                <div class="stats-view fade-in">
                    <div class="header-section mb-lg">
                        <div class="flex-between align-center">
                            <h1>Statistiche</h1>
                            <button id="btn-weekly-report" class="btn btn-sm btn-outline-primary">📊 Report</button>
                        </div>
                        <p class="text-secondary">I tuoi progressi in dettaglio.</p>
                    </div>

                    <!-- Money Stats -->
                    <div class="card mb-lg">
                        <h3>💰 Risparmio</h3>
                        <div class="text-center mt-md mb-md">
                            <div class="text-2xl font-bold text-success">Totale risparmiato: ${Calcs.formatCurrency(totalSaved)}</div>
                            <p class="text-secondary mt-xs">(In 1 anno risparmi: ${Calcs.formatCurrency(savings.yearly)})</p>
                        </div>
                    </div>

                    ${this.renderSavingsGoal(userData, Calcs)}

                    <!-- Health Recovery -->
                    <div class="card mb-lg">
                        <h3>❤️ Recupero Salute</h3>
                        <div class="health-timeline mt-md">
                            ${this.renderHealthMilestones(userData.quitDate)}
                        </div>
                    </div>

                    <!-- Trigger Analysis (Weighted Risk) -->
                    <div class="card mb-lg">
                        <h3>🔍 I Tuoi Nemici Principali (Rischio)</h3>
                        ${topTriggers.length > 0 ? `
                            <div class="top-triggers-list mt-md">
                                ${topTriggers.map(([id, score], index) => {
                const label = window.StopIt.Utils.Triggers.getTriggerLabel(id);
                const maxScore = topTriggers[0][1];
                const percent = Math.round((score / maxScore) * 100);

                return `
                                        <div class="trigger-stat-row">
                                            <div class="trigger-info">
                                                <span class="trigger-rank text-xl">${medals[index] || `#${index + 1}`}</span>
                                                <span class="trigger-name font-bold">${label}</span>
                                            </div>
                                            <div class="trigger-bar-container mt-xs">
                                                <div class="trigger-bar bg-danger" style="width: ${percent}%; height: 8px; border-radius: 4px;"></div>
                                            </div>
                                            <div class="trigger-count text-xs text-secondary text-right mt-xs">Rischio: ${score.toFixed(2)}</div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state-small text-center py-md">
                                <p class="text-secondary">Registra le tue voglie per calcolare i rischi.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;


            this.attachEventListeners(container, logs);
        }

        renderHealthMilestones(quitDate) {
            const days = window.StopIt.Utils.Calculations.calculateDaysSmokeFree(quitDate);
            const hoursSmokeFree = days * 24;

            const milestones = [
                { hours: 12, label: 'CO nel sangue normalizzato', icon: '🫁' },
                { hours: 48, label: 'Gusto e olfatto migliorati', icon: '👃' },
                { hours: 72, label: 'Respiro più facile', icon: '💨' },
                { hours: 336, label: 'Circolazione migliorata (2 sett)', icon: '❤️' },
                { hours: 2160, label: 'Funzione polmonare +10% (3 mesi)', icon: '🏃‍♀️' }
            ];

            return milestones.map(m => {
                const achieved = hoursSmokeFree >= m.hours;
                let statusText = '';

                if (achieved) {
                    statusText = 'Raggiunto!';
                } else {
                    const hoursLeft = m.hours - hoursSmokeFree;
                    const daysLeft = Math.ceil(hoursLeft / 24);
                    statusText = `Manca poco a questo traguardo, continua! (tra ${daysLeft} giorni)`;
                }

                return `
                    <div class="milestone-item ${achieved ? 'achieved' : ''}">
                        <div class="milestone-icon">${achieved ? '✅' : '⏳'}</div>
                        <div class="milestone-content">
                            <div class="milestone-title">${m.label}</div>
                            <div class="milestone-status">${statusText}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        renderSavingsGoal(userData, Calcs) {
            if (!userData.savingsGoal || !userData.savingsGoal.amount) return '';

            const moneySaved = Calcs.calculateMoneySaved(
                userData.quitDate,
                userData.costPerPack,
                userData.cigarettesPerDay,
                userData.cigarettesPerPack
            );

            const percent = Math.min(100, Math.round((moneySaved / userData.savingsGoal.amount) * 100));

            return `
                <div class="card mb-lg goal-card">
                    <h3>🎯 Obiettivo: ${userData.savingsGoal.name || 'Risparmio'}</h3>
                    <div class="flex-between mt-sm mb-xs">
                        <span class="text-sm">${Calcs.formatCurrency(moneySaved)}</span>
                        <span class="text-sm text-secondary">${Calcs.formatCurrency(userData.savingsGoal.amount)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percent}%"></div>
                    </div>
                    <p class="text-right text-xs mt-xs text-primary">${percent}% Raggiunto</p>
                </div>
            `;
        }

        attachEventListeners(container) {
            container.querySelector('#btn-weekly-report').addEventListener('click', () => {
                this.showWeeklyReport();
            });
        }

        renderWeeklyReportModal(data) {
            // Remove existing if any
            const existing = document.getElementById('report-modal-overlay');
            if (existing) existing.remove();

            const modalHtml = `
                <div id="report-modal-overlay" class="overlay">
                    <div class="overlay-content" style="max-width: 600px;">
                        <div class="flex-between mb-lg">
                            <h2>📊 Report Semanale</h2>
                            <button class="btn-icon" onclick="document.getElementById('report-modal-overlay').remove()">✕</button>
                        </div>
                        
                        <div class="report-body">
                            <div class="stats-grid mb-lg">
                                <div class="stat-card">
                                    <div class="stat-value text-success">${data.resisted}</div>
                                    <div class="stat-label">Voglie Vinte</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value text-danger">${data.relapses}</div>
                                    <div class="stat-label">Ricadute</div>
                                </div>
                            </div>
                            
                            <div class="card mb-md bg-accent-light">
                                <h3>🔥 Principale Nemico</h3>
                                <p class="text-xl">${data.topTrigger}</p>
                            </div>
                            
                            <div class="card mb-lg">
                                <h3>💡 Consiglio per te</h3>
                                <p class="italic">"${data.advice}"</p>
                            </div>

                            <button class="btn btn-primary btn-block" onclick="document.getElementById('report-modal-overlay').remove()">Chiudi Report</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        showWeeklyReport() {
            const logs = window.StopIt.State.getLogs();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const weeklyLogs = logs.filter(l => new Date(l.date || l.timestamp) >= oneWeekAgo);

            const total = weeklyLogs.length;
            if (total === 0) {
                window.StopIt.Utils.Notifications.show("Non hai registrato attività nell'ultima settimana.", 'info');
                return;
            }

            const resisted = weeklyLogs.filter(l => l.outcome === 'resisted').length;
            const relapses = weeklyLogs.filter(l => l.outcome === 'relapse').length;

            // Find top trigger
            const triggersMap = {};
            weeklyLogs.forEach(l => {
                if (l.triggers) l.triggers.forEach(t => triggersMap[t] = (triggersMap[t] || 0) + 1);
            });
            const topTriggerId = Object.keys(triggersMap).sort((a, b) => triggersMap[b] - triggersMap[a])[0];
            const topTriggerLabel = topTriggerId ? window.StopIt.Utils.Triggers.getTriggerLabel(topTriggerId) : 'Nessuno';
            const advice = relapses === 0
                ? "Eccezionale! Continua così, sei intoccabile!"
                : "Ogni caduta insegna qualcosa. Analizza il tuo trigger principale e prepara un piano.";

            this.renderWeeklyReportModal({
                resisted,
                relapses,
                topTrigger: topTriggerLabel,
                advice
            });
        }
    };
})();
