import { Game } from './game/Game.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const app = document.getElementById('app');

    if (!app) {
        throw new Error('App container not found');
    }

    app.appendChild(canvas);

    // Initialize the game
    const game = new Game(canvas);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        game.destroy();
    });
});
