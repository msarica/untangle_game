import { Point, GameState, LevelConfig, Circle, Line } from '../types/GameTypes.js';
import { GameLevel } from './GameLevel.js';
import { IntersectionDetector } from './IntersectionDetector.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputManager } from '../input/InputManager.js';
import { MathUtils } from '../utils/MathUtils.js';
import manifest from '../../public/manifest.json';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private inputManager: InputManager;
    private gameState: GameState;
    private animationId: number | null = null;
    private currentSolution: { circles: Circle[]; lines: Line[] } | null = null;
    private levelDisplay: HTMLElement;
    private versionDisplay: HTMLElement;
    private restartButton: HTMLButtonElement;
    private newGameButton: HTMLButtonElement;
    private solveButton: HTMLButtonElement;
    private congratulationsElement: HTMLElement;
    private nextLevelButton: HTMLButtonElement;
    private newGameDialog: HTMLElement;
    private confirmNewGameButton: HTMLButtonElement;
    private cancelNewGameButton: HTMLButtonElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.gameState = {
            circles: [],
            lines: [],
            draggedCircleId: null,
            canvasSize: { x: 0, y: 0 },
            currentLevel: this.loadSavedLevel(),
            isCompleted: false,
            levelConfigs: new Map<number, LevelConfig>()
        };

        // Get UI elements
        this.levelDisplay = document.getElementById('level-display')!;
        this.versionDisplay = document.getElementById('version-display')!;
        this.restartButton = document.getElementById('restart-btn') as HTMLButtonElement;
        this.newGameButton = document.getElementById('new-game-btn') as HTMLButtonElement;
        this.solveButton = document.getElementById('solve-btn') as HTMLButtonElement;
        this.congratulationsElement = document.getElementById('congratulations')!;
        this.nextLevelButton = document.getElementById('next-level-btn') as HTMLButtonElement;
        this.newGameDialog = document.getElementById('new-game-dialog')!;
        this.confirmNewGameButton = document.getElementById('confirm-new-game-btn') as HTMLButtonElement;
        this.cancelNewGameButton = document.getElementById('cancel-new-game-btn') as HTMLButtonElement;

        // Setup event listeners
        this.restartButton.addEventListener('click', () => this.restartLevel());
        this.newGameButton.addEventListener('click', () => this.showNewGameDialog());
        this.solveButton.addEventListener('click', () => this.showSolution());
        this.nextLevelButton.addEventListener('click', () => this.nextLevel());
        this.confirmNewGameButton.addEventListener('click', () => this.startNewGame());
        this.cancelNewGameButton.addEventListener('click', () => this.hideNewGameDialog());

        this.inputManager = new InputManager(
            canvas,
            this.onCircleDragStart.bind(this),
            this.onCircleDrag.bind(this),
            this.onCircleDragEnd.bind(this)
        );

        this.setupCanvas();
        this.initializeGame();
        this.updateVersionDisplay();
        this.gameLoop();
    }

    private setupCanvas(): void {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement!;
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.renderer.resize(width, height);
            this.gameState.canvasSize = { x: width, y: height };
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    /**
     * Initialize the current level by generating or loading the level configuration.
     * 
     * This method handles both new level generation and loading stored configurations.
     * It also sets up the input manager and performs initial intersection detection.
     */
    private initializeGame(): void {
        this.gameState.isCompleted = false;
        this.hideCongratulations();

        // Try to load saved game state first
        this.loadGameState();

        // If no saved state was loaded, generate a new level
        if (this.gameState.circles.length === 0) {
            // Check if we have a stored configuration for this level
            const storedConfig = this.gameState.levelConfigs.get(this.gameState.currentLevel);

            // Generate or reuse level configuration
            const level = GameLevel.generateLevel(this.gameState.currentLevel, this.gameState.canvasSize, storedConfig);
            this.gameState.circles = level.circles;
            this.gameState.lines = level.lines;
            this.currentSolution = level.solution || null;

            // Store the level configuration if it's new (not from stored config)
            if (!storedConfig) {
                this.storeLevelConfig(this.gameState.currentLevel, level.circles, level.lines, level.solution);
            }
        } else {
            // We have saved state, get the solution from stored config
            const storedConfig = this.gameState.levelConfigs.get(this.gameState.currentLevel);
            this.currentSolution = storedConfig?.solution || null;
        }

        // Update input manager with circles for hit testing
        this.inputManager.updateCircleHitTest(this.gameState.circles);

        // Initial intersection check
        IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);

        // Update level display
        this.updateLevelDisplay();
    }

    private updateLevelDisplay(): void {
        this.levelDisplay.textContent = `Level ${this.gameState.currentLevel}`;
    }

    private updateVersionDisplay(): void {
        console.log('Manifest version:', manifest.version);
        this.versionDisplay.textContent = `v${manifest.version}`;
    }

    private showCongratulations(): void {
        this.congratulationsElement.classList.add('show');
    }

    private hideCongratulations(): void {
        this.congratulationsElement.classList.remove('show');
    }

    private nextLevel(): void {
        this.gameState.currentLevel++;
        this.saveCurrentLevel();
        this.initializeGame();
    }

    private restartLevel(): void {
        // Clear saved state for current level
        localStorage.removeItem('untangle-game-state');

        // Reset completion status
        this.gameState.isCompleted = false;
        this.hideCongratulations();

        // Clear current circles and lines
        this.gameState.circles = [];
        this.gameState.lines = [];

        // Get the stored configuration for this level
        const storedConfig = this.gameState.levelConfigs.get(this.gameState.currentLevel);

        if (storedConfig) {
            // Use the stored configuration to regenerate the level
            const level = GameLevel.generateLevel(this.gameState.currentLevel, this.gameState.canvasSize, storedConfig);
            this.gameState.circles = level.circles;
            this.gameState.lines = level.lines;
            this.currentSolution = level.solution || null;

            console.log('Level restarted from stored configuration');
        } else {
            // If no stored config, generate a new level
            const level = GameLevel.generateLevel(this.gameState.currentLevel, this.gameState.canvasSize);
            this.gameState.circles = level.circles;
            this.gameState.lines = level.lines;
            this.currentSolution = level.solution || null;

            // Store the new configuration
            this.storeLevelConfig(this.gameState.currentLevel, level.circles, level.lines, level.solution);

            console.log('Level restarted with new configuration');
        }

        // Update input manager with circles for hit testing
        this.inputManager.updateCircleHitTest(this.gameState.circles);

        // Initial intersection check
        IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);

        // Update level display
        this.updateLevelDisplay();
    }

    private showNewGameDialog(): void {
        this.newGameDialog.classList.add('show');
    }

    private hideNewGameDialog(): void {
        this.newGameDialog.classList.remove('show');
    }

    private startNewGame(): void {
        this.gameState.currentLevel = 1;
        this.gameState.levelConfigs.clear(); // Clear all stored level configurations for a fresh start
        this.gameState.circles = [];
        this.gameState.lines = [];
        this.gameState.isCompleted = false;

        // Clear saved state
        localStorage.removeItem('untangle-game-state');
        this.saveCurrentLevel();
        this.hideNewGameDialog();
        this.initializeGame();
    }

    /**
     * Temporarily show the solution configuration for 3 seconds.
     * 
     * Saves the current state, applies the solution, then restores the original state.
     * This allows players to see the correct arrangement without permanently solving the puzzle.
     */
    private showSolution(): void {
        if (!this.currentSolution) {
            console.warn('No solution available for current level');
            return;
        }

        // Save current state
        const originalCircles = this.deepCopyCircles(this.gameState.circles);
        const originalLines = this.deepCopyLines(this.gameState.lines);

        // Apply the solution
        this.gameState.circles = this.deepCopyCircles(this.currentSolution.circles);
        this.gameState.lines = this.deepCopyLines(this.currentSolution.lines);

        // Update input manager and intersection detection
        this.inputManager.updateCircleHitTest(this.gameState.circles);
        IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);

        // Restore original state after 3 seconds
        setTimeout(() => {
            this.gameState.circles = originalCircles;
            this.gameState.lines = originalLines;
            this.inputManager.updateCircleHitTest(this.gameState.circles);
            IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);
        }, 3000);
    }

    private loadSavedLevel(): number {
        const savedLevel = localStorage.getItem('untangle-game-level');
        return savedLevel ? parseInt(savedLevel, 10) : 1;
    }

    private saveCurrentLevel(): void {
        localStorage.setItem('untangle-game-level', this.gameState.currentLevel.toString());
    }

    private saveGameState(): void {
        // Save current level
        this.saveCurrentLevel();

        // Save complete game state including circle positions
        const gameStateData = {
            circles: this.gameState.circles.map(circle => ({
                id: circle.id,
                position: { x: circle.position.x, y: circle.position.y },
                radius: circle.radius,
                isDragging: false, // Always save as not dragging
                connections: [...circle.connections]
            })),
            lines: this.gameState.lines.map(line => ({
                from: line.from,
                to: line.to,
                isIntersecting: line.isIntersecting
            })),
            currentLevel: this.gameState.currentLevel,
            isCompleted: this.gameState.isCompleted,
            lastSaved: Date.now()
        };

        localStorage.setItem('untangle-game-state', JSON.stringify(gameStateData));
        console.log('Complete game state saved - Level:', this.gameState.currentLevel, 'Circles:', this.gameState.circles.length);
    }

    private loadGameState(): void {
        try {
            const savedStateStr = localStorage.getItem('untangle-game-state');
            if (savedStateStr) {
                const savedState = JSON.parse(savedStateStr);

                // Only load if it's for the current level
                if (savedState.currentLevel === this.gameState.currentLevel) {
                    this.gameState.circles = savedState.circles || [];
                    this.gameState.lines = savedState.lines || [];
                    this.gameState.isCompleted = savedState.isCompleted || false;

                    console.log('Loaded saved game state - Level:', savedState.currentLevel, 'Circles:', savedState.circles?.length || 0);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
        }

        // Clear the game state when no saved state is found
        this.gameState.circles = [];
        this.gameState.lines = [];
        this.gameState.isCompleted = false;
        console.log('No saved state found, starting fresh');
    }

    private storeLevelConfig(levelNumber: number, circles: Circle[], lines: Line[], solution?: { circles: Circle[]; lines: Line[] }): void {
        const config: LevelConfig = {
            circles: this.deepCopyCircles(circles),
            lines: this.deepCopyLines(lines),
            levelNumber,
            canvasSize: { ...this.gameState.canvasSize },
            solution: solution ? {
                circles: this.deepCopyCircles(solution.circles),
                lines: this.deepCopyLines(solution.lines)
            } : undefined
        };
        this.gameState.levelConfigs.set(levelNumber, config);
    }

    private deepCopyCircles(circles: Circle[]): Circle[] {
        return circles.map(circle => ({
            ...circle,
            position: { ...circle.position },
            connections: [...circle.connections]
        }));
    }

    private deepCopyLines(lines: Line[]): Line[] {
        return lines.map(line => ({ ...line }));
    }

    private checkForCompletion(): void {
        if (this.gameState.isCompleted) return;

        // Check if there are any intersections
        const hasIntersections = this.gameState.lines.some(line => line.isIntersecting);

        if (!hasIntersections) {
            this.gameState.isCompleted = true;
            this.showCongratulations();
        }
    }

    private onCircleDragStart(circleId: number, _position: Point): void {
        const circle = this.gameState.circles.find(c => c.id === circleId);
        if (circle) {
            circle.isDragging = true;
            this.gameState.draggedCircleId = circleId;
        }
    }

    private onCircleDrag(circleId: number, position: Point): void {
        const circle = this.gameState.circles.find(c => c.id === circleId);
        if (circle) {
            // Clamp position to canvas bounds
            circle.position.x = MathUtils.clamp(position.x, circle.radius, this.gameState.canvasSize.x - circle.radius);
            circle.position.y = MathUtils.clamp(position.y, circle.radius, this.gameState.canvasSize.y - circle.radius);

            // Update intersection detection
            IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);

            // Don't check for completion while dragging - wait until drag ends
        }
    }

    private onCircleDragEnd(circleId: number): void {
        const circle = this.gameState.circles.find(c => c.id === circleId);
        if (circle) {
            circle.isDragging = false;
            this.gameState.draggedCircleId = null;

            // Check for completion after drag ends
            this.checkForCompletion();

            // Save state after user dropped the node
            this.saveGameState();
        }
    }

    private gameLoop(): void {
        this.renderer.render(
            this.gameState.circles,
            this.gameState.lines,
            this.gameState.draggedCircleId
        );

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    public destroy(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
