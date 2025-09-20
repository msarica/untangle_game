import { Circle, Line, Point, LevelConfig } from '../types/GameTypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameLevel {
    private static readonly CIRCLE_RADIUS = 30;
    private static readonly MIN_DISTANCE = 120; // Minimum distance between circles

    /**
     * Generate a specific level with progressive difficulty:
     * - Increment connections first, then increment nodes
     * - Level 1: 6 nodes, 3 connections each
     * - Level 2: 6 nodes, 4 connections each
     * - Level 3: 6 nodes, 5 connections each
     * - Level 4: 7 nodes, 3 connections each
     * - Level 5: 7 nodes, 4 connections each
     * - Level 6: 7 nodes, 5 connections each
     * - Level 7: 8 nodes, 3 connections each
     * - And so on...
     */
    static generateLevel(levelNumber: number, canvasSize: Point, storedConfig?: LevelConfig): { circles: Circle[]; lines: Line[] } {
        // If we have a stored config for this level and canvas size matches, use it
        if (storedConfig &&
            storedConfig.levelNumber === levelNumber &&
            storedConfig.canvasSize.x === canvasSize.x &&
            storedConfig.canvasSize.y === canvasSize.y) {
            // Deep copy the stored configuration to avoid modifying the original
            return {
                circles: this.deepCopyCircles(storedConfig.circles),
                lines: this.deepCopyLines(storedConfig.lines)
            };
        }

        // Otherwise, generate a new level
        const { nodeCount, connectionsPerNode } = this.calculateLevelParameters(levelNumber);
        return this.generateSolvableLevel(nodeCount, connectionsPerNode, canvasSize);
    }

    /**
     * Calculate node count and connections per node based on level number
     * Progression: increment connections first, then increment nodes
     */
    private static calculateLevelParameters(levelNumber: number): { nodeCount: number; connectionsPerNode: number } {
        const baseNodes = 6;
        const maxConnectionsPerNode = 3;

        // Calculate how many "cycles" of connection increases we've completed
        const connectionCycle = Math.floor((levelNumber - 1) / maxConnectionsPerNode);

        // Calculate the current connection level within the cycle (0, 1, 2)
        const connectionLevel = (levelNumber - 1) % maxConnectionsPerNode;

        // Node count increases by 1 for each complete cycle
        const nodeCount = baseNodes + connectionCycle;

        // Connections start at 3 and increase by 1 for each level in the cycle
        const connectionsPerNode = 3 + connectionLevel;

        return { nodeCount, connectionsPerNode };
    }

    /**
     * Generate a solvable level using the solution-first approach:
     * 1. Place nodes in a non-intersecting layout
     * 2. Draw non-intersecting lines (this is the solution)
     * 3. Scramble the node positions while keeping connections
     */
    private static generateSolvableLevel(
        nodeCount: number,
        connectionsPerNode: number,
        canvasSize: Point
    ): { circles: Circle[]; lines: Line[] } {

        // Step 1: Create nodes in a non-intersecting layout
        const circles = this.createNonIntersectingLayout(nodeCount, canvasSize);

        // Step 2: Generate connections (these will be non-intersecting by design)
        const lines = this.generateNonIntersectingConnections(circles, connectionsPerNode);

        // Step 3: Scramble the node positions while keeping connections
        this.scrambleNodePositions(circles, canvasSize);

        // Verify each node has at least 3 connections
        const minConnections = Math.min(...circles.map(c => c.connections.length));

        console.log(`Generated level: ${circles.length} nodes, ${lines.length} lines`);

        if (minConnections < 3) {
            console.error(`ERROR: Some nodes have fewer than 3 connections!`);
        }

        return { circles, lines };
    }

    /**
     * Create nodes in a layout that allows for non-intersecting connections
     */
    private static createNonIntersectingLayout(
        nodeCount: number,
        canvasSize: Point
    ): Circle[] {
        const circles: Circle[] = [];
        const margin = 100;
        const centerX = canvasSize.x / 2;
        const centerY = canvasSize.y / 2;
        const radius = Math.min(canvasSize.x, canvasSize.y) / 2 - margin;

        // Place nodes in a circle pattern for better non-intersecting potential
        for (let i = 0; i < nodeCount; i++) {
            const angle = (2 * Math.PI * i) / nodeCount;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            circles.push({
                id: i,
                position: { x, y },
                radius: this.CIRCLE_RADIUS,
                isDragging: false,
                connections: []
            });
        }

        return circles;
    }

    /**
     * Generate connections that are guaranteed to be non-intersecting
     */
    private static generateNonIntersectingConnections(
        circles: Circle[],
        connectionsPerNode: number
    ): Line[] {
        const lines: Line[] = [];
        const usedConnections = new Set<string>();

        // Reset connections
        circles.forEach(circle => circle.connections = []);

        // Create a priority queue of nodes that need more connections
        const nodesNeedingConnections = circles.map(circle => ({
            circle,
            priority: 0 // Higher priority = needs more connections
        }));

        // Keep processing until all nodes have at least 3 connections
        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            // Sort nodes by how many connections they need (descending)
            nodesNeedingConnections.sort((a, b) => {
                const aNeeds = Math.max(0, 3 - a.circle.connections.length);
                const bNeeds = Math.max(0, 3 - b.circle.connections.length);
                return bNeeds - aNeeds;
            });

            let madeConnection = false;

            for (const nodeData of nodesNeedingConnections) {
                const circle = nodeData.circle;

                // Skip if this node already has enough connections
                if (circle.connections.length >= 3) continue;

                const targetCircle = this.findBestConnectionTarget(circle, circles, connectionsPerNode, usedConnections);
                if (!targetCircle) continue;

                const connectionKey = `${Math.min(circle.id, targetCircle.id)}-${Math.max(circle.id, targetCircle.id)}`;
                circle.connections.push(targetCircle.id);
                targetCircle.connections.push(circle.id);
                usedConnections.add(connectionKey);

                lines.push({
                    from: circle.id,
                    to: targetCircle.id,
                    isIntersecting: false
                });

                madeConnection = true;
                break; // Move to next iteration to re-sort priorities
            }

            if (!madeConnection) {
                // If we can't make any more connections, break
                break;
            }

            attempts++;
        }

        // Final pass: add remaining connections up to the target
        circles.forEach(circle => {
            while (circle.connections.length < connectionsPerNode) {
                const targetCircle = this.findBestConnectionTarget(circle, circles, connectionsPerNode, usedConnections);
                if (!targetCircle) break;

                const connectionKey = `${Math.min(circle.id, targetCircle.id)}-${Math.max(circle.id, targetCircle.id)}`;
                circle.connections.push(targetCircle.id);
                targetCircle.connections.push(circle.id);
                usedConnections.add(connectionKey);

                lines.push({
                    from: circle.id,
                    to: targetCircle.id,
                    isIntersecting: false
                });
            }
        });

        return lines;
    }

    /**
     * Find the best connection target for a circle
     */
    private static findBestConnectionTarget(
        circle: Circle,
        circles: Circle[],
        connectionsPerNode: number,
        usedConnections: Set<string>
    ): Circle | null {
        const availableCircles = circles.filter(c =>
            c.id !== circle.id &&
            c.connections.length < connectionsPerNode &&
            !circle.connections.includes(c.id)
        );

        if (availableCircles.length === 0) return null;

        // Sort by distance to prefer closer connections
        const sorted = availableCircles.sort((a, b) => {
            const distA = MathUtils.distance(circle.position, a.position);
            const distB = MathUtils.distance(circle.position, b.position);
            return distA - distB;
        });

        const targetCircle = sorted[0];
        const connectionKey = `${Math.min(circle.id, targetCircle.id)}-${Math.max(circle.id, targetCircle.id)}`;

        return usedConnections.has(connectionKey) ? null : targetCircle;
    }

    /**
     * Scramble node positions while keeping the same connections
     */
    private static scrambleNodePositions(circles: Circle[], canvasSize: Point): void {
        const margin = 80; // Increased margin for better spacing
        const maxAttempts = 200; // Increased attempts

        // Generate new random positions for each circle
        circles.forEach(circle => {
            let position: Point;
            let attempts = 0;
            let bestPosition: Point | null = null;
            let bestScore = -1;

            // Try to place circle without overlapping, keeping track of best position
            do {
                position = MathUtils.randomPositionDistributed(canvasSize.x, canvasSize.y, margin);

                // Calculate a score for this position based on distance to other circles
                const minDistance = Math.min(
                    ...circles
                        .filter(c => c.id !== circle.id)
                        .map(c => MathUtils.distance(position, c.position))
                );

                // If this position has better spacing than our best so far, keep it
                if (minDistance > bestScore) {
                    bestScore = minDistance;
                    bestPosition = position;
                }

                attempts++;
            } while (
                attempts < maxAttempts &&
                circles.some(c =>
                    c.id !== circle.id &&
                    MathUtils.distance(position, c.position) < this.MIN_DISTANCE
                )
            );

            // Use the best position we found, or the last attempted position if no good position was found
            circle.position = bestPosition || position;
        });
    }

    /**
     * Deep copy circles to avoid modifying the original stored configuration
     */
    private static deepCopyCircles(circles: Circle[]): Circle[] {
        return circles.map(circle => ({
            ...circle,
            position: { ...circle.position },
            connections: [...circle.connections]
        }));
    }

    /**
     * Deep copy lines to avoid modifying the original stored configuration
     */
    private static deepCopyLines(lines: Line[]): Line[] {
        return lines.map(line => ({ ...line }));
    }
}

