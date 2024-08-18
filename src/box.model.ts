// box.model.ts
export interface Box {
    id: number;
    x: number;
    y: number;
    value: number;
    Gcost: number;
    Hcost: number;
    Fcost: number;
    isvisited: boolean;
    color: string;
    isStart: boolean;
    isEnd: boolean;
    isWall: boolean;
    neighbors: Box[];
    parent?: Box | null;
  }
  