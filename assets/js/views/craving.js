/**
 * Craving Log View
 * Allows users to track cravings and triggers
 */

(function () {
    window.StopIt.Views.CravingView = class CravingView {
        async render(container) {
            // Pre-calculate default date (now, but formatted for input)
            const now = new Date();
            const dateString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

            container.innerHTML = `
                <div class="craving-view fade-in">
                    <div class="header-section text-center mb-lg">
                        <h1>Registra Voglia</h1>
                        <p class="text-secondary">Sei più forte di quanto pensi! 💪</p>
                    </div>

                    <!-- Date & Time Override -->
                    <div class="card mb-lg">
                        <label class="block text-sm font-bold mb-xs" for="craving-date">Quando è successo?</label>
                        <input type="datetime-local" id="craving-date" class="form-input" value="${dateString}">
                    </div>

                    <div class="card mb-lg">
                        <h3>Quanto era forte? (Intensità)</h3>
                        <p class="text-secondary mb-md">Scegli il livello</p>
                        
                        <div class="intensity-selector">
                            <button class="intensity-btn" data-intensity="1">
                                <span class="emoji">😌</span>
                                <span class="label">Leggera</span>
                            </button>
                            <button class="intensity-btn" data-intensity="2">
                                <span class="emoji">😐</span>
                                <span class="label">Media</span>
                            </button>
                            <button class="intensity-btn" data-intensity="3">
                                <span class="emoji">😰</span>
                                <span class="label">Forte</span>
                            </button>
                            <button class="intensity-btn" data-intensity="4">
                                <span class="emoji">😱</span>
                                <span class="label">Intensa</span>
                            </button>
                        </div>
                    </div>

                    <div class="card mb-lg">
                        <h3>Cosa ha scatenato la voglia?</h3>
                        <div class="chips-container" id="trigger-grid">
                            <!-- Populated dynamically as CHIPS -->
                        </div>
                    </div>

                    <div class="card mb-lg">
                        <h3>Strategia usata (opzionale)</h3>
                        <div class="chips-container" id="strategy-chips">
                            <button class="chip" data-strategy="water">💧 Acqua</button>
                            <button class="chip" data-strategy="breathing">🫁 Respiro</button>
                            <button class="chip" data-strategy="walk">🚶‍♀️ Camminata</button>
                            <button class="chip" data-strategy="distraction">🎮 Distrazione</button>
                            <button class="chip" data-strategy="partner">💕 Partner</button>
                        </div>
                    </div>

                    <div class="card mb-lg">
                        <h3>Note</h3>
                        <textarea id="craving-notes" class="form-input" rows="3" placeholder="Come ti senti? Cosa stai pensando?"></textarea>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-success btn-block btn-lg mb-md" id="btn-resist">
                            ✅ Ho resistito!
                        </button>
                        <button class="btn btn-danger btn-block" id="btn-relapse">
                            ⚠️ Ho fumato
                        </button>
                    </div>
                </div>
            `;

            this.renderTriggers(container);
            this.renderHistory(container);
            this.attachEventListeners(container);
        }

        renderTriggers(container) {
            const triggers = window.StopIt.Utils.Triggers.getAllTriggers()
                .sort((a, b) => a.label.localeCompare(b.label)); // Alphabetical Sort

            const grid = container.querySelector('#trigger-grid');

            // Render as Chips for better visibility/clickability
            grid.innerHTML = triggers.map(t => `
                <button class="chip" data-trigger="${t.id}">
                    ${t.icon} ${t.label}
                </button>
            `).join('');
        }

        attachEventListeners(container) {
            let selectedIntensity = null;
            let selectedTriggers = [];
            let selectedStrategies = [];

            // Intensity Selection
            container.querySelectorAll('.intensity-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedIntensity = parseInt(btn.dataset.intensity);
                });
            });

            // Trigger Selection (Chips)
            container.querySelectorAll('#trigger-grid .chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('active');
                    const trigger = btn.dataset.trigger;
                    if (selectedTriggers.includes(trigger)) {
                        selectedTriggers = selectedTriggers.filter(t => t !== trigger);
                    } else {
                        selectedTriggers.push(trigger);
                    }
                });
            });

            // Strategy Selection
            container.querySelectorAll('#strategy-chips .chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    chip.classList.toggle('active');
                    const strategy = chip.dataset.strategy;
                    if (selectedStrategies.includes(strategy)) {
                        selectedStrategies = selectedStrategies.filter(s => s !== strategy);
                    } else {
                        selectedStrategies.push(strategy);
                    }
                });
            });

            // Submit Resist
            container.querySelector('#btn-resist').addEventListener('click', async () => {
                if (!selectedIntensity) {
                    alert('Seleziona prima l\'intensità della voglia');
                    return;
                }
                const dateVal = container.querySelector('#craving-date').value;
                const timestamp = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();

                const notes = document.getElementById('craving-notes').value;

                await this.saveLog('resisted', selectedIntensity, selectedTriggers, selectedStrategies, timestamp, notes);
            });

            // Submit Relapse
            container.querySelector('#btn-relapse').addEventListener('click', () => {
                window.StopIt.Utils.Modals.confirm(
                    'Registrare una Ricaduta?',
                    'Sei sicura di voler registrare una sigaretta fumata? Questo resetterà il tuo timer e toglierà alcuni badge.',
                    async () => {
                        const dateVal = container.querySelector('#craving-date').value;
                        const timestamp = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
                        const notes = document.getElementById('craving-notes').value;

                        // Use selectedIntensity if available, otherwise default to 3 (Forte) for relapse
                        await this.saveLog('relapse', selectedIntensity || 3, selectedTriggers, selectedStrategies, timestamp, notes);
                    }
                );
            });
        }

        async saveLog(outcome, intensity, triggers, strategies, customDate, notes) {
            const dateInput = document.getElementById('craving-date').value;
            const logDate = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

            const finalIntensity = intensity || 3;
            const finalStrategies = strategies;

            if (triggers.length === 0 && outcome === 'relapse') {
                window.StopIt.Utils.Notifications.show('Seleziona almeno un motivo (trigger) per capire cosa è successo.', 'error');
                return;
            }

            // Internal helper to proceed with saving
            const performSave = async () => {
                const logData = {
                    type: outcome === 'relapse' ? 'relapse' : 'craving',
                    outcome: outcome,
                    intensity: finalIntensity,
                    triggers: triggers,
                    strategies: finalStrategies,
                    notes: notes,
                    date: logDate,
                    timestamp: logDate
                };

                try {
                    await window.StopIt.State.addLog(logData);

                    if (outcome === 'relapse') {
                        // Update Quit Date to this relapse time
                        await window.StopIt.State.saveUserData({
                            quitDate: logDate
                        });
                        window.StopIt.Utils.Notifications.show('Ricaduta registrata. Non mollare, domani è un altro giorno! 💪', 'warning');
                    } else {
                        // Contextual JITAI message if resisted
                        const msg = this.getMotivationalMessage(triggers[0], strategies[0]);
                        window.StopIt.Utils.Notifications.show(`${msg} 🎉`, 'success');
                    }

                    // Check badges
                    await window.stopItApp.checkAndUnlockBadges();

                    // Go back to dashboard
                    window.stopItApp.navigateTo('dashboard');

                } catch (error) {
                    console.error('Error saving log:', error);
                    window.StopIt.Utils.Notifications.show('Errore nel salvataggio', 'error');
                }
            };

            // Revocation Warning (second confirmation for relapse)
            if (outcome === 'relapse') {
                // We've already confirmed once in the click handler, but the logic called for a second "Revocation" warning.
                // Let's combine them or prompt again. The logic had a second confirm.
                // Let's use Modals.confirm for that too.
                window.StopIt.Utils.Modals.confirm(
                    'Attenzione ai Badge',
                    "Se registri una ricaduta, alcuni badge (es. Streak) verranno revocati e il contatore si azzererà da quella data. Sicura?",
                    performSave // On Confirm
                    // On Cancel: do nothing
                );
            } else {
                await performSave();
            }
        }

        getMotivationalMessage(triggerId, strategyId) {
            const messages = [
                "Fantastico! Sei più forte della nicotina.",
                "Ogni volta che resisti, il tuo cervello guarisce.",
                "Grande forza di volontà!",
                "Stai riprendendo il controllo della tua vita.",
                "Sii orgogliosa di te stessa ora!"
            ];

            // Specific Trigger Messages
            if (triggerId === 'stress') return "Respirare è meglio di fumare. Hai gestito lo stress alla grande!";
            if (triggerId === 'coffee') return "Il caffè è più buono senza fumo. Ottimo lavoro!";
            if (triggerId === 'social') return "Sei libera, non hai bisogno di fumare per stare con gli altri!";

            // Specific Strategy Messages
            if (strategyId === 'water') return "L'acqua pulisce e idrata. Ottima scelta!";
            if (strategyId === 'breathing') return "Un respiro profondo vale più di mille tiri.";

            return messages[Math.floor(Math.random() * messages.length)];
        }

        getSupportMessage() {
            return "Una caduta non è un fallimento, è parte dell'imparare a camminare.";
        }

        renderHistory(container) {
            const logs = window.StopIt.State.getLogs().slice(0, 5); // Last 5 logs
            const historyContainer = document.createElement('div');
            historyContainer.className = 'card mt-lg mb-xl';

            if (logs.length === 0) {
                historyContainer.innerHTML = '<h3>Ultime Voglie</h3><p class="text-secondary">Nessun log ancora.</p>';
            } else {
                const listHtml = logs.map(log => {
                    const date = new Date(log.timestamp).toLocaleString();
                    const status = log.outcome === 'resisted' ? '✅ Resistito' : '⚠️ Fumato';
                    const triggers = (log.triggers || []).map(t => window.StopIt.Utils.Triggers.getTriggerLabel(t)).join(', ');

                    return `
                        <div class="log-item mb-sm pb-sm border-bottom">
                            <div class="flex-between">
                                <strong>${status}</strong>
                                <span class="text-xs text-secondary">${date}</span>
                            </div>
                            <div class="text-sm mt-xs">
                                ${triggers ? `Trigger: ${triggers}` : ''}
                            </div>
                            ${log.notes ? `<div class="text-sm text-secondary italic">"${log.notes}"</div>` : ''}
                        </div>
                    `;
                }).join('');

                historyContainer.innerHTML = `<h3>Ultime Voglie</h3><div class="history-list">${listHtml}</div>`;
            }

            container.querySelector('.craving-view').appendChild(historyContainer);
        }
    };
})();
