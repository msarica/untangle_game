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

export interface GameState {
    circles: Circle[];
    lines: Line[];
    draggedCircleId: number | null;
    canvasSize: Point;
}

export interface TouchEvent {
    clientX: number;
    clientY: number;
    identifier: number;
}
