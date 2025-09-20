import { Point, GameState, LevelConfig, Circle, Line } from '../types/GameTypes.js';
import { GameLevel } from './GameLevel.js';
import { IntersectionDetector } from './IntersectionDetector.js';
import { Renderer } from '../rendering/Renderer.js';
import { InputManager } from '../input/InputManager.js';
import { MathUtils } from '../utils/MathUtils.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private inputManager: InputManager;
    private gameState: GameState;
    private animationId: number | null = null;
    private levelDisplay: HTMLElement;
    private restartButton: HTMLButtonElement;
    private newGameButton: HTMLButtonElement;
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
        this.restartButton = document.getElementById('restart-btn') as HTMLButtonElement;
        this.newGameButton = document.getElementById('new-game-btn') as HTMLButtonElement;
        this.congratulationsElement = document.getElementById('congratulations')!;
        this.nextLevelButton = document.getElementById('next-level-btn') as HTMLButtonElement;
        this.newGameDialog = document.getElementById('new-game-dialog')!;
        this.confirmNewGameButton = document.getElementById('confirm-new-game-btn') as HTMLButtonElement;
        this.cancelNewGameButton = document.getElementById('cancel-new-game-btn') as HTMLButtonElement;

        // Setup event listeners
        this.restartButton.addEventListener('click', () => this.initializeGame());
        this.newGameButton.addEventListener('click', () => this.showNewGameDialog());
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

    private initializeGame(): void {
        this.gameState.isCompleted = false;
        this.hideCongratulations();

        // Check if we have a stored configuration for this level
        const storedConfig = this.gameState.levelConfigs.get(this.gameState.currentLevel);

        // Generate or reuse level configuration
        const level = GameLevel.generateLevel(this.gameState.currentLevel, this.gameState.canvasSize, storedConfig);
        this.gameState.circles = level.circles;
        this.gameState.lines = level.lines;

        // Store the level configuration if it's new (not from stored config)
        if (!storedConfig) {
            this.storeLevelConfig(this.gameState.currentLevel, level.circles, level.lines);
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

    private showNewGameDialog(): void {
        this.newGameDialog.classList.add('show');
    }

    private hideNewGameDialog(): void {
        this.newGameDialog.classList.remove('show');
    }

    private startNewGame(): void {
        this.gameState.currentLevel = 1;
        this.gameState.levelConfigs.clear(); // Clear all stored level configurations for a fresh start
        this.saveCurrentLevel();
        this.hideNewGameDialog();
        this.initializeGame();
    }

    private loadSavedLevel(): number {
        const savedLevel = localStorage.getItem('untangle-game-level');
        return savedLevel ? parseInt(savedLevel, 10) : 1;
    }

    private saveCurrentLevel(): void {
        localStorage.setItem('untangle-game-level', this.gameState.currentLevel.toString());
    }

    private storeLevelConfig(levelNumber: number, circles: Circle[], lines: Line[]): void {
        const config: LevelConfig = {
            circles: this.deepCopyCircles(circles),
            lines: this.deepCopyLines(lines),
            levelNumber,
            canvasSize: { ...this.gameState.canvasSize }
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
