/**
 * Plans View
 * Manage Coping Plans ("If... Then...")
 */

(function () {
    window.StopIt.Views.PlansView = class PlansView {
        async render(container) {
            const plans = window.StopIt.State.getPlans?.() || [];
            const triggers = window.StopIt.Utils.Triggers.getAllTriggers();

            container.innerHTML = `
                <div class="plans-view fade-in">
                    <div class="header-section text-center mb-lg">
                        <h1>Piani di Emergenza</h1>
                        <p class="text-secondary">Prepara la tua difesa! "Se succede X, farò Y"</p>
                    </div>

                    <div class="card mb-lg bg-light-yellow">
                        <h3>Nuovo Piano</h3>
                        <div class="form-group">
                            <label>Se succede questo...</label>
                            <select id="plan-trigger" class="form-input">
                                <option value="">Seleziona un momento a rischio</option>
                                ${triggers.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>...allora farò questo:</label>
                            <input type="text" id="plan-action" class="form-input" placeholder="Es: Bevo un bicchiere d'acqua, Faccio 10 respiri...">
                        </div>
                        <button class="btn btn-primary btn-block" id="btn-add-plan">Aggiungi Piano</button>
                    </div>

                    <div class="plans-list" id="plans-list">
                        ${this.renderPlansList(plans, triggers)}
                    </div>
                    
                    <button class="btn btn-secondary btn-block mt-xl" onclick="window.stopItApp.navigateTo('profile')">
                        ⬅ Torna al Profilo
                    </button>
                </div>
            `;

            this.attachEventListeners(container);
        }

        renderPlansList(plans, triggers) {
            if (plans.length === 0) {
                return '<div class="empty-state">Nessun piano definito. Creane uno sopra!</div>';
            }

            return plans.map(plan => {
                const triggerLabel = triggers.find(t => t.id === plan.triggerId)?.label || plan.triggerId;
                const triggerIcon = triggers.find(t => t.id === plan.triggerId)?.icon || '❓';

                return `
                    <div class="card plan-card mb-md bounce-in">
                        <div class="plan-header">
                            <div class="plan-trigger">
                                <span class="text-secondary text-xs">SE</span><br>
                                <strong>${triggerIcon} ${triggerLabel}</strong>
                            </div>
                            <div class="plan-arrow">➡️</div>
                            <div class="plan-action">
                                <span class="text-secondary text-xs">ALLORA</span><br>
                                <strong>${plan.action}</strong>
                            </div>
                        </div>
                        <button class="btn-icon-delete" data-id="${plan.id}">🗑️</button>
                    </div>
                `;
            }).join('');
        }

        attachEventListeners(container) {
            container.querySelector('#btn-add-plan').addEventListener('click', async () => {
                const triggerId = document.getElementById('plan-trigger').value;
                const action = document.getElementById('plan-action').value;

                if (!triggerId || !action) {
                    alert('Compila entrambi i campi!');
                    return;
                }

                try {
                    await window.StopIt.State.addPlan({ triggerId, action });
                    this.render(container); // Re-render
                } catch (e) {
                    console.error(e);
                    alert('Errore aggiunta piano');
                }
            });

            container.querySelectorAll('.btn-icon-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Eliminare questo piano?')) {
                        const id = e.target.closest('.btn-icon-delete').dataset.id; // Corrected target
                        await window.StopIt.State.deletePlan(parseInt(id)); // ID from DB is int
                        this.render(container);
                    }
                });
            });
        }
    };
})();
