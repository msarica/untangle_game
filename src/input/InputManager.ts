import { Circle, Point } from '../types/GameTypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class InputManager {
    private canvas: HTMLCanvasElement;
    private onCircleDragStart: (circleId: number, position: Point) => void;
    private onCircleDrag: (circleId: number, position: Point) => void;
    private onCircleDragEnd: (circleId: number) => void;

    private draggedCircleId: number | null = null;

    constructor(
        canvas: HTMLCanvasElement,
        onCircleDragStart: (circleId: number, position: Point) => void,
        onCircleDrag: (circleId: number, position: Point) => void,
        onCircleDragEnd: (circleId: number) => void
    ) {
        this.canvas = canvas;
        this.onCircleDragStart = onCircleDragStart;
        this.onCircleDrag = onCircleDrag;
        this.onCircleDragEnd = onCircleDragEnd;

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }

    private handleMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const position = this.getMousePosition(event);
        this.handlePointerDown(position);
    }

    private handleMouseMove(event: MouseEvent): void {
        event.preventDefault();
        if (this.draggedCircleId !== null) {
            const position = this.getMousePosition(event);
            this.handlePointerMove(position);
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        event.preventDefault();
        this.handlePointerUp();
    }

    private handleTouchStart(event: globalThis.TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const position = this.getTouchPosition(touch);
            this.handlePointerDown(position);
        }
    }

    private handleTouchMove(event: globalThis.TouchEvent): void {
        event.preventDefault();
        if (event.touches.length === 1 && this.draggedCircleId !== null) {
            const touch = event.touches[0];
            const position = this.getTouchPosition(touch);
            this.handlePointerMove(position);
        }
    }

    private handleTouchEnd(event: globalThis.TouchEvent): void {
        event.preventDefault();
        this.handlePointerUp();
    }

    private handlePointerDown(position: Point): void {
        // Find circle at position
        const circleId = this.findCircleAtPosition(position);
        if (circleId !== null) {
            this.draggedCircleId = circleId;
            this.onCircleDragStart(circleId, position);
        }
    }

    private handlePointerMove(position: Point): void {
        if (this.draggedCircleId !== null) {
            this.onCircleDrag(this.draggedCircleId, position);
        }
    }

    private handlePointerUp(): void {
        if (this.draggedCircleId !== null) {
            this.onCircleDragEnd(this.draggedCircleId);
            this.draggedCircleId = null;
        }
    }

    private findCircleAtPosition(_position: Point): number | null {
        // This will be set by the game when circles are available
        return null;
    }

    private getMousePosition(event: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    private getTouchPosition(touch: Touch): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    public updateCircleHitTest(circles: Circle[]): void {
        // Override the findCircleAtPosition method to use current circles
        (this as any).findCircleAtPosition = (position: Point): number | null => {
            for (const circle of circles) {
                if (MathUtils.pointInCircle(position, circle.position, circle.radius)) {
                    return circle.id;
                }
            }
            return null;
        };
    }
}
