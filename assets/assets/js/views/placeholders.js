/**
 * Views Placeholders
 */

(function () {
    window.StopIt.Views.CravingView = class CravingView {
        async render(container) {
            container.innerHTML = '<div class="craving-view"><h1>Registra Voglia</h1><p>Funzionalità in arrivo...</p></div>';
        }
    };

    window.StopIt.Views.StatsView = class StatsView {
        async render(container) {
            container.innerHTML = '<div class="stats-view"><h1>Statistiche</h1><p>Grafici in arrivo...</p></div>';
        }
    };

    window.StopIt.Views.BadgesView = class BadgesView {
        async render(container) {
            const badges = window.StopIt.Utils.BadgesEngine.getAllBadges();
            container.innerHTML = `
                <div class="badges-view">
                    <h1>Badge</h1>
                    <div class="badges-grid">
                        ${badges.map(b => `<div class="badge-item">${b.icon} ${b.name}</div>`).join('')}
                    </div>
                </div>
            `;
        }
    };

    window.StopIt.Views.ProfileView = class ProfileView {
        async render(container) {
            container.innerHTML = `
                <div class="profile-view">
                    <h1>Profilo</h1>
                    <button class="btn btn-danger" onclick="window.StopIt.Auth.logout(); window.location.reload();">Logout</button>
                    <button class="btn btn-warning mt-md" onclick="window.StopIt.DB.deleteUserData(window.StopIt.Auth.getCurrentUser()).then(() => window.location.reload())">Elimina dati e resetta</button>
                </div>
            `;
        }
    };
})();
