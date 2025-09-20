import { Point } from '../types/GameTypes.js';

export class MathUtils {
    /**
     * Calculate distance between two points
     */
    static distance(p1: Point, p2: Point): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if a point is inside a circle
     */
    static pointInCircle(point: Point, circleCenter: Point, radius: number): boolean {
        return this.distance(point, circleCenter) <= radius;
    }

    /**
     * Check if two line segments intersect
     * Using the line segment intersection algorithm
     */
    static lineSegmentsIntersect(
        p1: Point, p2: Point, // First line segment
        p3: Point, p4: Point  // Second line segment
    ): boolean {
        const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

        if (Math.abs(denom) < 1e-10) {
            return false; // Lines are parallel
        }

        const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
        const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    /**
     * Generate random position within bounds
     */
    static randomPosition(maxX: number, maxY: number, margin: number = 50): Point {
        return {
            x: margin + Math.random() * (maxX - 2 * margin),
            y: margin + Math.random() * (maxY - 2 * margin)
        };
    }

    /**
     * Generate a more evenly distributed random position using grid-based approach
     */
    static randomPositionDistributed(maxX: number, maxY: number, margin: number = 50): Point {
        // Create a grid-based distribution for better spacing
        const gridCols = Math.floor(Math.sqrt((maxX - 2 * margin) * (maxY - 2 * margin) / (margin * margin)));
        const gridRows = Math.floor((maxY - 2 * margin) / margin);

        const cellWidth = (maxX - 2 * margin) / gridCols;
        const cellHeight = (maxY - 2 * margin) / gridRows;

        const col = Math.floor(Math.random() * gridCols);
        const row = Math.floor(Math.random() * gridRows);

        return {
            x: margin + col * cellWidth + Math.random() * cellWidth,
            y: margin + row * cellHeight + Math.random() * cellHeight
        };
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
}
