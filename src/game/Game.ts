import { Circle, Line, Point, GameState } from '../types/GameTypes.js';
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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.gameState = {
            circles: [],
            lines: [],
            draggedCircleId: null,
            canvasSize: { x: 0, y: 0 }
        };

        this.inputManager = new InputManager(
            canvas,
            this.onCircleDragStart.bind(this),
            this.onCircleDrag.bind(this),
            this.onCircleDragEnd.bind(this)
        );

        this.setupCanvas();
        this.initializeGame();
        this.startGameLoop();
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
        const level = GameLevel.generateLevel1(this.gameState.canvasSize);
        this.gameState.circles = level.circles;
        this.gameState.lines = level.lines;

        // Update input manager with circles for hit testing
        this.inputManager.updateCircleHitTest(this.gameState.circles);

        // Initial intersection check
        IntersectionDetector.updateIntersections(this.gameState.circles, this.gameState.lines);
    }

    private onCircleDragStart(circleId: number, position: Point): void {
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
        }
    }

    private onCircleDragEnd(circleId: number): void {
        const circle = this.gameState.circles.find(c => c.id === circleId);
        if (circle) {
            circle.isDragging = false;
            this.gameState.draggedCircleId = null;
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

    private startGameLoop(): void {
        this.gameLoop();
    }

    public destroy(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
    }
}
