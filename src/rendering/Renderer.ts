import { Circle, Line, Point } from '../types/GameTypes.js';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private canvasSize: Point;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = context;
        this.canvasSize = { x: canvas.width, y: canvas.height };
    }

    /**
     * Resize canvas to match container
     */
    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasSize = { x: width, y: height };
    }

    /**
     * Clear the canvas
     */
    clear(): void {
        this.ctx.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    /**
     * Render all game elements
     */
    render(circles: Circle[], lines: Line[], draggedCircleId: number | null): void {
        this.clear();
        this.renderLines(lines, draggedCircleId, circles);
        this.renderCircles(circles, draggedCircleId);
    }

    /**
     * Render lines between circles
     */
    private renderLines(lines: Line[], draggedCircleId: number | null, circles: Circle[]): void {
        lines.forEach(line => {
            const fromCircle = circles.find(c => c.id === line.from)!;
            const toCircle = circles.find(c => c.id === line.to)!;

            // Determine line color based on intersection state
            let color = '#666';
            let width = 2;

            if (line.isIntersecting) {
                color = '#ff4444';
                width = 3;
            } else if (draggedCircleId !== null &&
                (line.from === draggedCircleId || line.to === draggedCircleId)) {
                color = '#4CAF50';
                width = 3;
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(fromCircle.position.x, fromCircle.position.y);
            this.ctx.lineTo(toCircle.position.x, toCircle.position.y);
            this.ctx.stroke();
        });
    }

    /**
     * Render circles
     */
    private renderCircles(circles: Circle[], draggedCircleId: number | null): void {
        circles.forEach(circle => {
            const isDragged = circle.id === draggedCircleId;

            // Circle fill
            this.ctx.fillStyle = isDragged ? '#4CAF50' : '#2196F3';
            this.ctx.beginPath();
            this.ctx.arc(circle.position.x, circle.position.y, circle.radius, 0, 2 * Math.PI);
            this.ctx.fill();

            // Circle border
            this.ctx.strokeStyle = isDragged ? '#2E7D32' : '#1976D2';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Circle number
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                circle.id.toString(),
                circle.position.x,
                circle.position.y
            );
        });
    }

}
