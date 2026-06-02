import { GAME_CONFIG } from "../config/GameConstants.js";

export default class PathfindingSystem {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 32;
    this.cols = 0;
    this.rows = 0;
    this.grid = []; // 2D grid: 1 = walkable, 0 = blocked
    this.collisionPadding = 0;
  }

  create() {
    this.initializeGrid();
  }

  initializeGrid() {
    const scene = this.scene;
    const worldWidth = scene.physics.world.bounds.width || GAME_CONFIG.worldWidth;
    const worldHeight = scene.physics.world.bounds.height || GAME_CONFIG.worldHeight;

    this.cols = Math.ceil(worldWidth / this.gridSize);
    this.rows = Math.ceil(worldHeight / this.gridSize);
    this.collisionPadding = this.getCollisionPadding();

    // Initialize all grid cells as walkable (1)
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(1));

    // Cache static colliders bounding boxes for faster overlay checking
    const staticColliders = [];

    // 1. Check Phaser static group walls (fallback mode or static colliders)
    if (scene.walls && typeof scene.walls.getChildren === "function") {
      scene.walls.getChildren().forEach((child) => {
        const bounds = this.getStaticColliderBounds(child);
        if (bounds) {
          staticColliders.push(this.getPaddedRect(bounds, this.collisionPadding));
        }
      });
    }

    // 2. Check Phaser static group map object walls (benches, trees, etc.)
    if (scene.objectWalls && typeof scene.objectWalls.getChildren === "function") {
      scene.objectWalls.getChildren().forEach((child) => {
        const bounds = this.getStaticColliderBounds(child);
        if (bounds) {
          staticColliders.push(this.getPaddedRect(bounds, this.collisionPadding));
        }
      });
    }

    // 3. Check extra rectangular collision definitions if cached
    if (Array.isArray(scene.objectCollisionRects)) {
      scene.objectCollisionRects.forEach((rect) => {
        if (rect) {
          staticColliders.push(this.getPaddedRect(rect, this.collisionPadding));
        }
      });
    }

    // Evaluate each grid cell
    const cellRect = new Phaser.Geom.Rectangle(0, 0, this.gridSize, this.gridSize);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.gridSize + this.gridSize / 2;
        const y = r * this.gridSize + this.gridSize / 2;
        cellRect.setTo(c * this.gridSize, r * this.gridSize, this.gridSize, this.gridSize);

        // A. Check Tilemap Collision layer if scene.walls is a TilemapLayer.
        // Use the player's body clearance area, not only the center point, so wider obstacles are avoided.
        if (scene.walls && typeof scene.walls.getTileAtWorldXY === "function") {
          const tileCheckRect = this.getPaddedRect(cellRect, this.collisionPadding);
          if (this.isBlockedByTileLayer(scene.walls, tileCheckRect, x, y)) {
            this.grid[r][c] = 0; // Blocked
            continue;
          }
        }

        // B. Check against cached bounding rectangles of static colliders
        let isBlockedByObject = false;
        for (let i = 0; i < staticColliders.length; i++) {
          const rect = staticColliders[i];
          if (Phaser.Geom.Rectangle.Overlaps(rect, cellRect)) {
            isBlockedByObject = true;
            break;
          }
        }

        if (isBlockedByObject) {
          this.grid[r][c] = 0; // Blocked
        }
      }
    }
    console.log(`Pathfinding grid initialized. Size: ${this.cols}x${this.rows} cells.`);
  }

  getCollisionPadding() {
    const bodyWidth = GAME_CONFIG.playerBodyWidth || 28;
    const bodyHeight = GAME_CONFIG.playerBodyHeight || 36;
    return Math.ceil(Math.max(bodyWidth, bodyHeight) / 2);
  }

  getStaticColliderBounds(child) {
    if (!child) return null;
    if (child.body) {
      return new Phaser.Geom.Rectangle(child.body.x, child.body.y, child.body.width, child.body.height);
    }
    if (typeof child.getBounds === "function") {
      return child.getBounds();
    }
    return null;
  }

  getPaddedRect(rect, padding) {
    return new Phaser.Geom.Rectangle(
      rect.x - padding,
      rect.y - padding,
      rect.width + padding * 2,
      rect.height + padding * 2
    );
  }

  isBlockedByTileLayer(layer, rect, fallbackX, fallbackY) {
    if (typeof layer.getTilesWithinWorldXY === "function") {
      const tiles = layer.getTilesWithinWorldXY(rect.x, rect.y, rect.width, rect.height, true);
      return tiles.some((tile) => tile && tile.index !== -1 && tile.collides);
    }

    const tile = layer.getTileAtWorldXY(fallbackX, fallbackY, true);
    return !!(tile && tile.index !== -1 && tile.collides);
  }

  /**
   * Find a path from pixel (startX, startY) to pixel (endX, endY)
   * Returns an array of Phaser.Math.Vector2 waypoint coordinates
   */
  findPath(startX, startY, endX, endY) {
    // 1. Convert start/end world positions into grid coordinates
    let startC = Math.floor(startX / this.gridSize);
    let startR = Math.floor(startY / this.gridSize);
    let endC = Math.floor(endX / this.gridSize);
    let endR = Math.floor(endY / this.gridSize);
    let finalTargetX = endX;
    let finalTargetY = endY;

    // 2. Clamp grid coordinates inside bounds
    startC = Phaser.Math.Clamp(startC, 0, this.cols - 1);
    startR = Phaser.Math.Clamp(startR, 0, this.rows - 1);
    endC = Phaser.Math.Clamp(endC, 0, this.cols - 1);
    endR = Phaser.Math.Clamp(endR, 0, this.rows - 1);

    // 3. Fallback: If start cell is blocked, find the nearest walkable cell to start from
    if (!this.isWalkable(startC, startR)) {
      const nearestStart = this.findNearestWalkableCell(startC, startR);
      if (nearestStart) {
        startC = nearestStart.c;
        startR = nearestStart.r;
      } else {
        return []; // No way out
      }
    }

    // 4. Fallback: If clicked target is blocked, automatically relocate to the nearest walkable cell
    if (!this.isWalkable(endC, endR)) {
      const nearestEnd = this.findNearestWalkableCell(endC, endR, 14);
      if (nearestEnd) {
        endC = nearestEnd.c;
        endR = nearestEnd.r;
        finalTargetX = endC * this.gridSize + this.gridSize / 2;
        finalTargetY = endR * this.gridSize + this.gridSize / 2;
      } else {
        return []; // Cannot move to any adjacent target
      }
    }

    // If starting and ending in the same grid cell, move straight to the final destination point
    if (startC === endC && startR === endR) {
      return [new Phaser.Math.Vector2(finalTargetX, finalTargetY)];
    }

    // 5. Standard A* Algorithm
    const openList = [];
    const closedList = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    const startNode = {
      c: startC,
      r: startR,
      g: 0,
      h: this.getOctileDistance(startC, startR, endC, endR),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    let destinationNode = null;

    while (openList.length > 0) {
      // Find the node with the lowest F score in the open list
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();

      closedList[current.r][current.c] = true;

      // Destination reached!
      if (current.c === endC && current.r === endR) {
        destinationNode = current;
        break;
      }

      // Check 8-way neighbors
      const neighbors = this.getNeighbors(current.c, current.r);
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];

        if (closedList[neighbor.r][neighbor.c]) continue;

        // Octile distance transition costs: 1.0 for orthogonal, 1.414 for diagonal
        const isDiagonal = neighbor.c !== current.c && neighbor.r !== current.r;
        const moveCost = isDiagonal ? 1.414 : 1.0;
        const tentativeG = current.g + moveCost;

        // Check if neighbor already in open list
        let existingNode = openList.find((node) => node.c === neighbor.c && node.r === neighbor.r);

        if (!existingNode) {
          const neighborNode = {
            c: neighbor.c,
            r: neighbor.r,
            g: tentativeG,
            h: this.getOctileDistance(neighbor.c, neighbor.r, endC, endR),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openList.push(neighborNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    // 6. Trace parent nodes back to form path waypoints
    if (!destinationNode) {
      return []; // Path not found
    }

    const path = [];
    let temp = destinationNode;
    while (temp !== null) {
      // Convert cell index back into pixel world coordinates at the center of the grid cell
      const px = temp.c * this.gridSize + this.gridSize / 2;
      const py = temp.r * this.gridSize + this.gridSize / 2;
      path.push(new Phaser.Math.Vector2(px, py));
      temp = temp.parent;
    }

    path.reverse();

    // Optimize: replace the very last coordinate with the clicked coordinate only when it is safe.
    // If the click landed on a blocked object, keep the relocated safe cell center instead.
    if (path.length > 0) {
      path[path.length - 1].set(finalTargetX, finalTargetY);
    }

    return path;
  }

  isWalkable(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    return this.grid[r][c] === 1;
  }

  getNeighbors(c, r) {
    const neighbors = [];

    // Orthogonal directions
    const dirs = [
      { dc: 0, dr: -1 }, // Up
      { dc: 0, dr: 1 },  // Down
      { dc: -1, dr: 0 }, // Left
      { dc: 1, dr: 0 }   // Right
    ];

    dirs.forEach((dir) => {
      const nc = c + dir.dc;
      const nr = r + dir.dr;
      if (this.isWalkable(nc, nr)) {
        neighbors.push({ c: nc, r: nr });
      }
    });

    // Diagonal directions (Up-Left, Up-Right, Down-Left, Down-Right)
    const diagonals = [
      { dc: -1, dr: -1 },
      { dc: 1, dr: -1 },
      { dc: -1, dr: 1 },
      { dc: 1, dr: 1 }
    ];

    diagonals.forEach((diag) => {
      const nc = c + diag.dc;
      const nr = r + diag.dr;

      if (this.isWalkable(nc, nr)) {
        // Corner cutting prevention:
        // For a diagonal step to be legal, BOTH adjacent horizontal/vertical cells must also be walkable.
        // This stops the player from 'clipping' through tight wall corners.
        const adj1Walkable = this.isWalkable(c + diag.dc, r);
        const adj2Walkable = this.isWalkable(c, r + diag.dr);

        if (adj1Walkable && adj2Walkable) {
          neighbors.push({ c: nc, r: nr });
        }
      }
    });

    return neighbors;
  }

  getOctileDistance(c1, r1, c2, r2) {
    const dc = Math.abs(c1 - c2);
    const dr = Math.abs(r1 - r2);
    return (dc + dr) + (Math.SQRT2 - 2) * Math.min(dc, dr);
  }

  findNearestWalkableCell(c, r, maxDistance = 8) {
    let queue = [{ c, r, dist: 0 }];
    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    visited[r][c] = true;

    while (queue.length > 0) {
      const current = queue.shift();
      if (this.isWalkable(current.c, current.r)) {
        return { c: current.c, r: current.r };
      }

      if (current.dist >= maxDistance) continue;

      const directions = [
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 },
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 },
        { dc: -1, dr: -1 },
        { dc: 1, dr: -1 },
        { dc: -1, dr: 1 },
        { dc: 1, dr: 1 }
      ];

      for (let i = 0; i < directions.length; i++) {
        const dir = directions[i];
        const nc = current.c + dir.dc;
        const nr = current.r + dir.dr;

        if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows) {
          if (!visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push({ c: nc, r: nr, dist: current.dist + 1 });
          }
        }
      }
    }
    return null;
  }

  destroy() {
    this.grid = [];
  }
}
