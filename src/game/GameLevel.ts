import { Circle, Line, Point } from '../types/GameTypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameLevel {
    private static readonly CIRCLE_RADIUS = 20;
    private static readonly MIN_DISTANCE = 80; // Minimum distance between circles

    /**
     * Generate level 1 with 6 circles, each connected to 3 others
     */
    static generateLevel1(canvasSize: Point): { circles: Circle[]; lines: Line[] } {
        const circles = this.generateCircles(6, canvasSize);
        const lines = this.generateConnections(circles, 3);

        return { circles, lines };
    }

    /**
     * Generate circles with random positions
     */
    private static generateCircles(count: number, canvasSize: Point): Circle[] {
        const circles: Circle[] = [];

        for (let i = 0; i < count; i++) {
            let position: Point;
            let attempts = 0;
            const maxAttempts = 100;

            // Try to place circle without overlapping
            do {
                position = MathUtils.randomPosition(canvasSize.x, canvasSize.y, 50);
                attempts++;
            } while (
                attempts < maxAttempts &&
                circles.some(circle =>
                    MathUtils.distance(position, circle.position) < this.MIN_DISTANCE
                )
            );

            circles.push({
                id: i,
                position,
                radius: this.CIRCLE_RADIUS,
                isDragging: false,
                connections: []
            });
        }

        return circles;
    }

    /**
     * Generate connections between circles
     */
    private static generateConnections(circles: Circle[], connectionsPerCircle: number): Line[] {
        const lines: Line[] = [];
        const usedConnections = new Set<string>();

        // Reset connections
        circles.forEach(circle => circle.connections = []);

        // Generate connections for each circle
        circles.forEach(circle => {
            const availableCircles = circles.filter(c =>
                c.id !== circle.id &&
                circle.connections.length < connectionsPerCircle &&
                c.connections.length < connectionsPerCircle
            );

            // Shuffle available circles
            const shuffled = [...availableCircles].sort(() => Math.random() - 0.5);

            for (const targetCircle of shuffled) {
                if (circle.connections.length >= connectionsPerCircle) break;

                const connectionKey = `${Math.min(circle.id, targetCircle.id)}-${Math.max(circle.id, targetCircle.id)}`;

                if (!usedConnections.has(connectionKey)) {
                    circle.connections.push(targetCircle.id);
                    targetCircle.connections.push(circle.id);
                    usedConnections.add(connectionKey);

                    lines.push({
                        from: circle.id,
                        to: targetCircle.id,
                        isIntersecting: false
                    });
                }
            }
        });

        return lines;
    }
}
