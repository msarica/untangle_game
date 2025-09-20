import { Circle, Line } from '../types/GameTypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class IntersectionDetector {
    /**
     * Check for line intersections and update line states.
     * 
     * Compares all pairs of lines to detect intersections and marks intersecting lines.
     * Lines that share a common endpoint are not considered intersecting.
     * 
     * @param circles Array of circles for position lookup
     * @param lines Array of lines to check for intersections
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
     * Check if two lines share a common endpoint.
     * 
     * @param line1 First line to check
     * @param line2 Second line to check
     * @returns True if the lines share a common endpoint
     */
    private static shareEndpoint(line1: Line, line2: Line): boolean {
        return line1.from === line2.from ||
            line1.from === line2.to ||
            line1.to === line2.from ||
            line1.to === line2.to;
    }

}
