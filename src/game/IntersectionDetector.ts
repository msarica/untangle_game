import { Circle, Line } from '../types/GameTypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class IntersectionDetector {
    /**
     * Check for line intersections and update line states
     */
    static updateIntersections(circles: Circle[], lines: Line[]): void {
        // Reset all intersection states
        lines.forEach(line => line.isIntersecting = false);

        // Check each pair of lines for intersections
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                const line1 = lines[i];
                const line2 = lines[j];

                // Skip if lines share a common endpoint
                if (this.shareEndpoint(line1, line2)) {
                    continue;
                }

                const circle1From = circles.find(c => c.id === line1.from)!;
                const circle1To = circles.find(c => c.id === line1.to)!;
                const circle2From = circles.find(c => c.id === line2.from)!;
                const circle2To = circles.find(c => c.id === line2.to)!;

                if (MathUtils.lineSegmentsIntersect(
                    circle1From.position,
                    circle1To.position,
                    circle2From.position,
                    circle2To.position
                )) {
                    line1.isIntersecting = true;
                    line2.isIntersecting = true;
                }
            }
        }
    }

    /**
     * Check if two lines share a common endpoint
     */
    private static shareEndpoint(line1: Line, line2: Line): boolean {
        return line1.from === line2.from ||
            line1.from === line2.to ||
            line1.to === line2.from ||
            line1.to === line2.to;
    }

    /**
     * Get lines that intersect with lines connected to a specific circle
     */
    static getIntersectingLinesForCircle(circleId: number, circles: Circle[], lines: Line[]): Line[] {
        const circle = circles.find(c => c.id === circleId);
        if (!circle) return [];

        const intersectingLines: Line[] = [];

        // Get all lines connected to this circle
        const connectedLines = lines.filter(line =>
            line.from === circleId || line.to === circleId
        );

        // Find lines that intersect with the connected lines
        connectedLines.forEach(connectedLine => {
            const otherLines = lines.filter(line =>
                line !== connectedLine &&
                !this.shareEndpoint(line, connectedLine)
            );

            otherLines.forEach(otherLine => {
                const circle1From = circles.find(c => c.id === connectedLine.from)!;
                const circle1To = circles.find(c => c.id === connectedLine.to)!;
                const circle2From = circles.find(c => c.id === otherLine.from)!;
                const circle2To = circles.find(c => c.id === otherLine.to)!;

                if (MathUtils.lineSegmentsIntersect(
                    circle1From.position,
                    circle1To.position,
                    circle2From.position,
                    circle2To.position
                )) {
                    if (!intersectingLines.includes(otherLine)) {
                        intersectingLines.push(otherLine);
                    }
                }
            });
        });

        return intersectingLines;
    }
}
