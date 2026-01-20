/**
 * Badges View
 * Gamification gallery
 */

(function () {
    window.StopIt.Views.BadgesView = class BadgesView {
        async render(container) {
            const unlockedBadges = window.StopIt.State.getBadges();
            const allBadges = window.StopIt.Utils.BadgesEngine.getAllBadges();
            const categories = window.StopIt.Utils.BadgesEngine.getBadgeCategories();

            container.innerHTML = `
                <div class="badges-view fade-in">
                    <div class="header-section text-center mb-lg">
                        <h1>La Tua Bacheca</h1>
                        <div class="badges-progress-summary">
                            <span class="badge-count">${unlockedBadges.length}</span> / ${allBadges.length} Badge
                        </div>
                        <div class="progress-bar-container mt-sm">
                            <div class="progress-bar" style="width: ${(unlockedBadges.length / allBadges.length) * 100}%"></div>
                        </div>
                    </div>

                    <div class="badges-filter-scroll mb-lg">
                        ${categories.map(cat => `
                            <button class="filter-chip ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
                                ${cat.icon} ${cat.name}
                            </button>
                        `).join('')}
                    </div>

                    <div class="badges-grid" id="badges-grid">
                        <!-- Populated by JS -->
                    </div>
                </div>
            `;

            this.renderBadgesGrid(container.querySelector('#badges-grid'), allBadges, unlockedBadges, 'all');
            this.attachEventListeners(container, allBadges, unlockedBadges);
        }

        renderBadgesGrid(grid, allBadges, unlockedBadges, category) {
            const filteredBadges = category === 'all'
                ? allBadges
                : allBadges.filter(b => b.category === category);

            const listContainer = grid; // Renamed from 'grid' to 'listContainer' for clarity with the new code

            if (filteredBadges.length === 0) {
                listContainer.innerHTML = '<div class="text-center py-xl text-secondary">Nessun badge in questa categoria.</div>';
                return;
            }

            // Grid Layout
            listContainer.style.display = 'grid';
            listContainer.style.gridTemplateColumns = 'repeat(2, 1fr)'; // 2 columns
            listContainer.style.gap = '12px';

            listContainer.innerHTML = filteredBadges.map(badge => {
                const unlocked = unlockedBadges.find(b => b.id === badge.id);
                const statusClass = unlocked ? 'unlocked' : 'locked';
                const opacity = unlocked ? '1' : '0.5';
                const grayscale = unlocked ? '0' : '1';

                return `
                    <div class="badge-card-grid card text-center p-md cursor-pointer" onclick="window.StopIt.Views.BadgesView.showDetails('${badge.id}')" style="opacity: ${opacity}; filter: grayscale(${grayscale}); transition: transform 0.2s;">
                        <div class="text-4xl mb-sm">${badge.icon}</div>
                        <div class="font-bold text-sm mb-xs" style="min-height: 40px; display: flex; align-items: center; justify-content: center;">${badge.name}</div>
                        
                        ${unlocked ?
                        `<div class="text-xs text-success">🏆 Sbloccato</div>` :
                        `<div class="text-xs text-secondary">🔒 Bloccato</div>`
                    }
                    </div>
                `;
            }).join('');

            // Static method hack for onclick
            window.StopIt.Views.BadgesView.showDetails = (badgeId) => {
                const badge = window.StopIt.Utils.BadgesEngine.getBadgeById(badgeId);
                const isUnlocked = unlockedBadges.find(b => b.id === badgeId);

                const statusHtml = isUnlocked
                    ? `<div class="text-success font-bold mt-md">✅ Sbloccato il ${new Date(isUnlocked.unlockedAt).toLocaleDateString()}</div>`
                    : `<div class="text-secondary mt-md">🔒 <strong>Condizione:</strong> ${badge.condition || 'Continua a migliorare!'}</div>`;

                window.StopIt.Utils.Modals.alert(
                    `${badge.icon} ${badge.name}`,
                    `
                    <p>${badge.description}</p>
                    ${statusHtml}
                    `
                );
            };
        }

        attachEventListeners(container, allBadges, unlockedBadges) {
            container.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.renderBadgesGrid(
                        container.querySelector('#badges-grid'),
                        allBadges,
                        unlockedBadges,
                        chip.dataset.category
                    );
                });
            });
        }
    };
})();
