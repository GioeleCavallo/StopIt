/**
 * Triggers Module
 */

(function () {
    const TRIGGERS = [
        { id: 'stress', label: 'Stress', icon: '😰' },
        { id: 'social', label: 'Socialità', icon: '👥' },
        { id: 'boredom', label: 'Noia', icon: '😴' },
        { id: 'after_meal', label: 'Dopo i pasti', icon: '🍽️' },
        { id: 'coffee', label: 'Caffè', icon: '☕' },
        { id: 'alcohol', label: 'Alcol', icon: '🍷' },
        { id: 'work', label: 'Lavoro', icon: '💼' },
        { id: 'driving', label: 'Guidando', icon: '🚗' },
        { id: 'phone', label: 'Al telefono', icon: '📱' },
        { id: 'morning', label: 'Mattina', icon: '🌅' },
        { id: 'evening', label: 'Sera', icon: '🌙' },
        { id: 'anxiety', label: 'Ansia', icon: '😟' },
        { id: 'sadness', label: 'Tristezza', icon: '😢' },
        { id: 'anger', label: 'Rabbia', icon: '😠' },
        { id: 'celebration', label: 'Festa', icon: '🎉' },
        { id: 'break', label: 'Pausa', icon: '⏸️' },
        { id: 'menstrual', label: 'Fase mestruale', icon: '🌸' },
        { id: 'other', label: 'Altro', icon: '❓' }
    ];

    window.StopIt.Utils.Triggers = {
        getTriggerById: function (id) {
            return TRIGGERS.find(t => t.id === id);
        },

        getTriggerLabel: function (id) {
            const trigger = this.getTriggerById(id);
            return trigger ? trigger.label : id;
        },

        getAllTriggers: function () {
            return TRIGGERS;
        }
    };
})();
