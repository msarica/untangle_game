import { Game } from './game/Game.js';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const gameContainer = document.getElementById('game-container');

    if (!gameContainer) {
        throw new Error('Game container not found');
    }

    gameContainer.appendChild(canvas);

    // Initialize the game
    const game = new Game(canvas);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        game.destroy();
    });
});
