import { Component, OnInit, OnDestroy } from '@angular/core';
import { Box } from '../../box.model';
import { interval, Subscription } from 'rxjs';
import { start } from 'repl';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;
  boxes: Box[][] = [];
  arrangedboxes: Box[] = [];
  curentBrush: string = "Start";
  numberOfBoxes: number = 0;
  hasStart: boolean = false;
  hasEnd: boolean = false;
  isMouseDown: boolean = false;
  rows: number = 16;
  cols: number = 16;
  startingbox: Box | null = null;
  endingbox: Box | null = null;
  private readonly COLOR_OPEN = 'blue';    // Color for open nodes
  private readonly COLOR_CLOSED = 'yellow'; // Color for closed nodes
  

  constructor() {
    this.initializeBoxes();
  }

  ngOnInit() {
    // Initialize your interval subscription here if needed
  }
  // Mouse Staff
  onMouseDown(x: number, y: number, event: MouseEvent) {
    this.isMouseDown = true;
    this.onBoxClick(x, y);
    event.preventDefault(); // Prevent default behavior if needed
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseOver(x: number, y: number, event: MouseEvent) {
    if (this.isMouseDown) {
      this.onBoxClick(x, y);
    }
  }

  initializeBoxes() {
    var len = 0;
    for (let i = 0; i < this.rows; i++) {
        const row: Box[] = [];
        for (let j = 0; j < this.cols; j++) {
            row.push({
                id: len,
                x: i,
                y: j,
                value: 0,
                Gcost: 0,
                Hcost: 0,
                Fcost: 0,
                isvisited: false,
                isStart: false,
                isEnd: false,
                isWall: false,
                color: 'white', // Default color
                neighbors: []
            });
            len++;
            
        }
        this.boxes.push(row);
    }
    this.numberOfBoxes = len;

    // Set neighbors for each box
    for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
            this.setNeighbors(i, j); // This should work for all rows and columns
        }
    }
}
  //Neighbors
  setNeighbors(row: number, col: number) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], // Top left, top, top right
      [0, -1],           [0, 1],   // Left,         , Right
      [1, -1],  [1, 0],  [1, 1]     // Bottom left,  bottom, bottom right
    ];
  
    const currentBox = this.boxes[row][col];
  
    directions.forEach(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
  
      // Check if the neighbor is within bounds
      if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
        currentBox.neighbors.push(this.boxes[newRow][newCol]);
      }
    });
  }

  isDiagonalNeighbor(currentRow: number, currentCol: number, neighborRow: number, neighborCol: number): boolean {
    const rowDiff = Math.abs(currentRow - neighborRow);
    const colDiff = Math.abs(currentCol - neighborCol);
    return rowDiff === 1 && colDiff === 1; // Both must be 1 for a diagonal neighbor
}

  colurNeighbors(x: number, y: number) {
  for (const box of this.boxes[x][y].neighbors) {
    // Get the neighbor's row and column from its ID
    const neighborRow = Math.floor(box.id / this.cols);
    const neighborCol = box.id % this.cols;

    if (this.isDiagonalNeighbor(x, y, neighborRow, neighborCol)) {
        box.color = "lightgreen"; // Example color for diagonal neighbors
    } else {
        box.color = "green"; // Color for non-diagonal neighbors
    }
  }
}

async startProcess(endBox: Box) {
  if (this.startingbox !== null) {
      let currentBox = this.startingbox;

      for (let i = 0; i < 50; i++) {
          currentBox.isvisited = true;
          if (!currentBox.isStart && !currentBox.isEnd) {
            currentBox.color = this.COLOR_CLOSED; // Mark open nodes
          }
          await this.delay(250); // Wait for one second

          // Calculate costs for neighbors
          for (const box of currentBox.neighbors) {
              if (!box.isvisited && !box.isWall) { // Skip wall boxes
                  box.Gcost = this.calculateG(box, currentBox);
                  box.Hcost = this.calculateH(box, endBox);
                  box.Fcost = this.calculateF(box);
                  box.parent = currentBox; 
                  if (!box.isvisited && (!box.isStart && !box.isEnd)) {
                    box.color = this.COLOR_OPEN; // Mark open nodes
                  }
              }
          }

          // Check if we have reached the target box
          if (currentBox === endBox) {
              console.log("Reached the target box!");
              break;
          }

          // Find the next box
          let nextBox = null;
          for (const box of currentBox.neighbors) {
              if (!box.isvisited && !box.isWall && (nextBox === null || box.Fcost < nextBox.Fcost)) {
                  nextBox = box;
              }
          }

          // If no next box was found, exit the loop
          if (nextBox === null) {
              console.log("No more unvisited neighbors!");
              break;
          }

          currentBox = nextBox;
      }

      // Highlight the path after finishing the search
      this.highlightPath(endBox);
  }
}


async highlightPath(endBox: Box) {
  let currentBox: Box | null = endBox;
  let path: Box[] = [];

  // Trace back to the start box, building the path array
  while (currentBox) {
    path.push(currentBox);
    currentBox = currentBox.parent || null; // Move to the parent box
  }

  // Highlight the path in reverse order
  while (path.length > 0) {
    currentBox = path.pop()!; // Use non-null assertion operator `!`
    
    if (currentBox) {
      if (!currentBox.isStart && !currentBox.isEnd) {
        currentBox.color = 'purple'; // Change the path color
      }
      await this.delay(250); // Wait for one second
    }
  }
}

  calculateG(currentBox: Box, parentBox: Box): number {
    const cost = 1; 
    return parentBox.Gcost + cost;
}

  calculateH(currentBox: Box, endBox: Box): number {
    // Using Manhattan distance
    return Math.abs(currentBox.x - endBox.x) + Math.abs(currentBox.y - endBox.y);
}
calculateF(currentBox: Box): number {
  return (currentBox.Gcost || 0) + (currentBox.Hcost || 0);
}


  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onBoxClick(x: number, y: number) {
    if(this.curentBrush == "Start"){
      if(!this.boxes[x][y].isStart&&!this.boxes[x][y].isEnd&&!this.boxes[x][y].isWall&&!this.hasStart){
        this.boxes[x][y].isStart = true;
        this.boxes[x][y].color = "green";
        this.hasStart = true;
        this.startingbox = this.boxes[x][y];
        this.curentBrush = "End";
        return;
      }
      else if(this.boxes[x][y].isStart&&this.hasStart){
        this.boxes[x][y].isStart = false;
        this.boxes[x][y].color = "white";
        this.hasStart = false;
        this.startingbox = null;
        return;
      }
    }
    if(this.curentBrush == "End"){
      if(!this.boxes[x][y].isStart&&!this.boxes[x][y].isEnd&&!this.boxes[x][y].isWall&&!this.hasEnd){
        this.boxes[x][y].isEnd = true;
        this.boxes[x][y].color = "red";
        this.hasEnd = true;
        this.endingbox = this.boxes[x][y];
        this.curentBrush = "Wall";
        return;
      }
      else if(this.boxes[x][y].isEnd&&this.hasEnd){
        this.boxes[x][y].isEnd = false;
        this.boxes[x][y].color = "white";
        this.hasEnd = false;
        this.endingbox = null;
        return;
      }
    }
    if(this.curentBrush == "Wall"){
      if(!this.boxes[x][y].isStart&&!this.boxes[x][y].isEnd&&!this.boxes[x][y].isWall){
        this.boxes[x][y].isWall = true;
        this.boxes[x][y].color = "brown";
        return;
      }
      else if(this.boxes[x][y].isWall){
        this.boxes[x][y].isWall = false;
        this.boxes[x][y].color = "white";
        return;
      }
    }
    if(this.curentBrush == "Test"){
      if(!this.boxes[x][y].isStart&&!this.boxes[x][y].isEnd&&!this.boxes[x][y].isWall){
        this.colurNeighbors(x, y);
        return;
      }
    }
  }

  onStartButtonClick(){
    this.processBoxes();
    if ( this.endingbox != null){
      this.startProcess(this.endingbox);
    }
  }

  onResetButtonClick(){
    this.boxes = [];
    this.curentBrush = "Start";
    this.hasStart  = false;
    this.hasEnd = false;
    this.initializeBoxes();
  }

  async processBoxes() {
    for (const box of this.arrangedboxes) {
      // Do something with the box
      box.color = "purple";
  
      // Wait for one second
      await this.delay(1000); // 1000 milliseconds = 1 second
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // Button Functions
  onStartClick(){
    this.curentBrush = "Start";
  }
  onEndClick(){
    this.curentBrush = "End";
  }
  onWallClick(){
    this.curentBrush = "Wall";
  }  
  onTestClick(){
    this.curentBrush = "Test";
  }
}