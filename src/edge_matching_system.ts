// Edge matching system for rotated blocks in Aetheria project

interface BlockConfiguration {
  id: string;
  heights: string; // 9-digit string like "555335135"
  rotation?: {
    axis: 'x' | 'y' | 'z';
    angle: number; // 0, 90, 180, 270
  };
}

interface EdgePattern {
  north: number[];
  east: number[];
  south: number[];
  west: number[];
}

class BlockEdgeMatcher {
  
  /**
   * Extract edge patterns from a 9-digit height string
   * Grid layout: 1 2 3
   *              4 5 6
   *              7 8 9
   */
  static extractEdges(heights: string): EdgePattern {
    const h = heights.split('').map(Number);
    
    return {
      north: [h[0], h[1], h[2]], // positions 1,2,3
      east:  [h[2], h[5], h[8]], // positions 3,6,9
      south: [h[8], h[7], h[6]], // positions 9,8,7 (reversed for matching)
      west:  [h[6], h[3], h[0]]  // positions 7,4,1 (reversed for matching)
    };
  }

  /**
   * Apply rotation transformation to edge patterns
   */
  static rotateEdges(edges: EdgePattern, axis: string, angle: number): EdgePattern {
    const rotations = Math.floor(angle / 90) % 4;
    let result = { ...edges };

    if (axis === 'z') {
      // Z-axis rotation (most common for planar blocks)
      for (let i = 0; i < rotations; i++) {
        const temp = result.north;
        result.north = result.west.slice().reverse(); // West becomes North (reversed)
        result.west = result.south;                   // South becomes West
        result.south = result.east.slice().reverse(); // East becomes South (reversed)
        result.east = temp;                           // North becomes East
      }
    } else if (axis === 'y') {
      // Y-axis rotation (pitch)
      for (let i = 0; i < rotations; i++) {
        const temp = result.north;
        result.north = result.south.slice().reverse();
        result.south = temp.slice().reverse();
        // East and West edges need height reversal for Y rotation
        result.east = result.east.slice().reverse();
        result.west = result.west.slice().reverse();
      }
    } else if (axis === 'x') {
      // X-axis rotation (roll)
      for (let i = 0; i < rotations; i++) {
        const temp = result.east;
        result.east = result.west.slice().reverse();
        result.west = temp.slice().reverse();
        // North and South edges need height reversal for X rotation
        result.north = result.north.slice().reverse();
        result.south = result.south.slice().reverse();
      }
    }

    return result;
  }

  /**
   * Get the effective edges of a block considering its rotation
   */
  static getEffectiveEdges(block: BlockConfiguration): EdgePattern {
    const baseEdges = this.extractEdges(block.heights);
    
    if (!block.rotation || block.rotation.angle === 0) {
      return baseEdges;
    }

    return this.rotateEdges(baseEdges, block.rotation.axis, block.rotation.angle);
  }

  /**
   * Check if two blocks can be adjacent (blockB placed to the specified direction of blockA)
   */
  static canBeAdjacent(
    blockA: BlockConfiguration, 
    blockB: BlockConfiguration, 
    direction: 'north' | 'south' | 'east' | 'west'
  ): boolean {
    const edgesA = this.getEffectiveEdges(blockA);
    const edgesB = this.getEffectiveEdges(blockB);

    // Define which edges need to match based on placement direction
    const edgeMatches = {
      north: { a: 'north', b: 'south' },  // A's north edge matches B's south edge
      south: { a: 'south', b: 'north' },  // A's south edge matches B's north edge
      east:  { a: 'east',  b: 'west'  },  // A's east edge matches B's west edge
      west:  { a: 'west',  b: 'east'  }   // A's west edge matches B's east edge
    };

    const match = edgeMatches[direction];
    const edgeA = edgesA[match.a as keyof EdgePattern];
    const edgeB = edgesB[match.b as keyof EdgePattern];

    // Edges match if all corresponding height values are equal
    return edgeA.length === edgeB.length && 
           edgeA.every((height, index) => height === edgeB[index]);
  }

  /**
   * Find all valid blocks that can be placed adjacent to a given block
   */
  static findValidAdjacents(
    sourceBlock: BlockConfiguration,
    direction: 'north' | 'south' | 'east' | 'west',
    availableBlocks: BlockConfiguration[]
  ): BlockConfiguration[] {
    return availableBlocks.filter(block => 
      this.canBeAdjacent(sourceBlock, block, direction)
    );
  }

  /**
   * Generate a unique identifier for a rotated block
   */
  static getRotatedBlockId(baseId: string, rotation?: { axis: string; angle: number }): string {
    if (!rotation || rotation.angle === 0) {
      return baseId;
    }
    return `${baseId}_${rotation.axis}${rotation.angle}`;
  }

  /**
   * Parse a rotated block ID back to its components
   */
  static parseRotatedBlockId(rotatedId: string): { baseId: string; rotation?: { axis: string; angle: number } } {
    const parts = rotatedId.split('_');
    
    if (parts.length === 1) {
      return { baseId: parts[0] };
    }

    const rotationPart = parts[1];
    const axis = rotationPart.charAt(0) as 'x' | 'y' | 'z';
    const angle = parseInt(rotationPart.slice(1));

    return {
      baseId: parts[0],
      rotation: { axis, angle }
    };
  }
}

// Example usage:
class WaveFunctionCollapse {
  private blockDatabase: BlockConfiguration[];
  private adjacencyCache: Map<string, Map<string, boolean>> = new Map();

  constructor(blocks: BlockConfiguration[]) {
    this.blockDatabase = blocks;
    this.precomputeAdjacencies();
  }

  /**
   * Precompute adjacency relationships for performance
   */
  private precomputeAdjacencies(): void {
    const directions: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
    
    for (const blockA of this.blockDatabase) {
      const keyA = BlockEdgeMatcher.getRotatedBlockId(blockA.id, blockA.rotation);
      this.adjacencyCache.set(keyA, new Map());
      
      for (const direction of directions) {
        for (const blockB of this.blockDatabase) {
          const keyB = BlockEdgeMatcher.getRotatedBlockId(blockB.id, blockB.rotation);
          const cacheKey = `${direction}:${keyB}`;
          
          const canAdjacent = BlockEdgeMatcher.canBeAdjacent(blockA, blockB, direction);
          this.adjacencyCache.get(keyA)!.set(cacheKey, canAdjacent);
        }
      }
    }
  }

  /**
   * Get valid blocks for a position based on already placed neighbors
   */
  getValidBlocks(
    position: { x: number; y: number },
    placedBlocks: Map<string, BlockConfiguration>,
    allPossibleBlocks: BlockConfiguration[]
  ): BlockConfiguration[] {
    const neighbors = [
      { pos: { x: position.x, y: position.y - 1 }, direction: 'north' as const },
      { pos: { x: position.x, y: position.y + 1 }, direction: 'south' as const },
      { pos: { x: position.x + 1, y: position.y }, direction: 'east' as const },
      { pos: { x: position.x - 1, y: position.y }, direction: 'west' as const }
    ];

    return allPossibleBlocks.filter(candidateBlock => {
      // Check compatibility with all placed neighbors
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.pos.x},${neighbor.pos.y}`;
        const neighborBlock = placedBlocks.get(neighborKey);
        
        if (neighborBlock) {
          const oppositeDirection = this.getOppositeDirection(neighbor.direction);
          if (!BlockEdgeMatcher.canBeAdjacent(neighborBlock, candidateBlock, oppositeDirection)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private getOppositeDirection(direction: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
    const opposites = {
      north: 'south' as const,
      south: 'north' as const,
      east: 'west' as const,
      west: 'east' as const
    };
    return opposites[direction];
  }
}

// Example: Generate all rotation variants for a block
function generateRotationVariants(baseBlock: { id: string; heights: string }): BlockConfiguration[] {
  const variants: BlockConfiguration[] = [];
  
  // Original block
  variants.push({ id: baseBlock.id, heights: baseBlock.heights });
  
  // Z-axis rotations (most common for architectural blocks)
  for (const angle of [90, 180, 270]) {
    variants.push({
      id: baseBlock.id,
      heights: baseBlock.heights,
      rotation: { axis: 'z', angle }
    });
  }
  
  // Add Y and X rotations if needed for specific blocks
  // This would be based on your rotation rules from the config
  
  return variants;
}

export { BlockEdgeMatcher, WaveFunctionCollapse, generateRotationVariants };