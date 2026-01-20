/**
 * Tutorial Module
 * Simple interactive guide for first-time users
 */

(function () {
    window.StopIt = window.StopIt || {};
    window.StopIt.Tutorial = {

        start: function () {
            // Only start if on dashboard
            if (!document.querySelector('.dashboard-view')) return;

            this.steps = [
                {
                    target: '#btn-craving-main',
                    title: 'Pulsante Panico',
                    text: 'Quando senti una voglia irrefrenabile, premi qui SUBITO! Ti aiuteremo a resistere.'
                },
                {
                    target: '.nav-item[data-view="stats"]',
                    title: 'I tuoi Progressi',
                    text: 'Qui vedrai quanti soldi e salute stai guadagnando ogni giorno.'
                },
                {
                    target: '.nav-item[data-view="badges"]',
                    title: 'Premi e Traguardi',
                    text: 'Sblocca nuovi badge man mano che avanzi nel tuo percorso.'
                }
            ];

            this.currentStep = 0;
            this.createOverlay();
            this.showStep();
        },

        createOverlay: function () {
            const overlay = document.createElement('div');
            overlay.id = 'tutorial-overlay';
            overlay.innerHTML = `
                <div class="tutorial-mask"></div>
                <div class="tutorial-card bounce-in">
                    <h3 id="tut-title">Title</h3>
                    <p id="tut-text">Text</p>
                    <div class="text-right mt-md">
                        <button class="btn btn-sm btn-secondary" id="tut-skip">Salta</button>
                        <button class="btn btn-sm btn-primary" id="tut-next">Avanti</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Add Styles dynamically if not present
            if (!document.getElementById('tutorial-css')) {
                const style = document.createElement('style');
                style.id = 'tutorial-css';
                style.textContent = `
                    #tutorial-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; pointer-events: none; }
                    .tutorial-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); pointer-events: auto; }
                    .tutorial-card { position: absolute; background: white; padding: 20px; border-radius: 15px; width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); pointer-events: auto; z-index: 10001; transition: all 0.3s ease; bottom: 100px; left: 50%; transform: translateX(-50%); border: 2px solid var(--color-primary); }
                    .highlight-element { position: relative; z-index: 10000; box-shadow: 0 0 0 4px var(--color-primary), 0 0 0 100vh rgba(0,0,0,0.5); background: white; border-radius: 8px; }
                `;
                document.head.appendChild(style);
            }

            document.getElementById('tut-next').addEventListener('click', () => this.nextStep());
            document.getElementById('tut-skip').addEventListener('click', () => this.end());
            document.getElementById('tut-skip').style.pointerEvents = 'auto';
            document.getElementById('tut-next').style.pointerEvents = 'auto';
        },

        showStep: function () {
            const step = this.steps[this.currentStep];
            const targetEl = document.querySelector(step.target);

            // Reset previous highlights
            document.querySelectorAll('.highlight-element').forEach(el => el.classList.remove('highlight-element'));

            if (targetEl) {
                targetEl.classList.add('highlight-element');
                // Scroll to element
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            const card = document.querySelector('.tutorial-card');
            document.getElementById('tut-title').textContent = step.title;
            document.getElementById('tut-text').textContent = step.text;

            const btnNext = document.getElementById('tut-next');
            btnNext.textContent = (this.currentStep === this.steps.length - 1) ? 'Finito! 🚀' : 'Avanti';
        },

        nextStep: function () {
            this.currentStep++;
            if (this.currentStep >= this.steps.length) {
                this.end();
            } else {
                this.showStep();
            }
        },

        end: function () {
            document.getElementById('tutorial-overlay').remove();
            document.querySelectorAll('.highlight-element').forEach(el => el.classList.remove('highlight-element'));
            // Mark tutorial as seen in state if needed, or just end
            console.log('Tutorial ended');
        }
    };
})();
