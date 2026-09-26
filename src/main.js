import { Game } from "./game.js";

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('game-canvas');
    // Expose game instance to window for validation and hostile testing
    window.__SPLIT_SECOND_GAME__ = game;
});
