export interface Point {
    x: number;
    y: number;
}

export interface Circle {
    id: number;
    position: Point;
    radius: number;
    isDragging: boolean;
    connections: number[]; // IDs of connected circles
}

export interface Line {
    from: number; // Circle ID
    to: number;   // Circle ID
    isIntersecting: boolean;
}

export interface LevelConfig {
    circles: Circle[];
    lines: Line[];
    levelNumber: number;
    canvasSize: Point;
    solution?: {
        circles: Circle[];
        lines: Line[];
    };
}

export interface GameState {
    circles: Circle[];
    lines: Line[];
    draggedCircleId: number | null;
    canvasSize: Point;
    currentLevel: number;
    isCompleted: boolean;
    levelConfigs: Map<number, LevelConfig>; // Store level configurations by level number
}
