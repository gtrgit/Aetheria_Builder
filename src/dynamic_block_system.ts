import { engine, Transform, GltfContainer, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

// Store block data with entities
type BlockData = {
  entity: Entity
  heights: string  // e.g., "555555555"
  position: Vector3
}

// Array to store all blocks with their data
const blocks: BlockData[] = []

// Function to create a block
function createBlock(heights: string, position: Vector3): BlockData {
  const entity = engine.addEntity()
  
  // Add Transform component
  Transform.create(entity, {
    position: position,
    scale: Vector3.create(1, 1, 1),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  
  // Add GltfContainer component
  GltfContainer.create(entity, {
    src: `assets/blocks/aetheria_clean_${heights}.glb`
  })
  
  // Store block data
  const blockData: BlockData = {
    entity: entity,
    heights: heights,
    position: position
  }
  
  blocks.push(blockData)
  return blockData
}

// Function to update a block's GLB by changing its heights
function updateBlockHeights(blockIndex: number, newHeights: string): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  
  // Update the heights data
  block.heights = newHeights
  
  // Update the GltfContainer component to load new GLB
  GltfContainer.createOrReplace(block.entity, {
    src: `assets/blocks/aetheria_${newHeights}.glb`
  })
  
  console.log(`Updated block ${blockIndex} to heights: ${newHeights}`)
  return true
}

// Helper function to modify corner and center heights
function modifyPointHeight(heights: string, point: number, newHeight: number): string {
  // Modifiable points (1-indexed): 1, 3, 5, 7, 9
  // Grid layout:
  // 1 2 3
  // 4 5 6  <- 5 is center
  // 7 8 9
  // Convert to 0-indexed: 0, 2, 4, 6, 8
  const modifiablePositions = [0, 2, 4, 6, 8]
  
  if (point < 1 || point > 5) {
    console.error(`Invalid point ${point}. Use 1-5 (1-4 for corners, 5 for center).`)
    return heights
  }
  
  if (newHeight < 0 || newHeight > 5) {
    console.error(`Invalid height ${newHeight}. Use 0-5.`)
    return heights
  }
  
  // Convert heights string to array
  const heightArray = heights.split('').map(h => parseInt(h))
  
  // Update the point
  const position = modifiablePositions[point - 1]
  heightArray[position] = newHeight
  
  // Convert back to string
  return heightArray.join('')
}

// Function to update a specific corner of a block (corners 1-4)
function updateBlockCorner(blockIndex: number, corner: number, newHeight: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4.`)
    return false
  }
  
  return updateBlockPoint(blockIndex, corner, newHeight)
}

// Function to update the center point of a block (point 5)
function updateBlockCenter(blockIndex: number, newHeight: number): boolean {
  return updateBlockPoint(blockIndex, 5, newHeight)
}

// Function to update any modifiable point (corners 1-4 or center 5)
function updateBlockPoint(blockIndex: number, point: number, newHeight: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  const newHeights = modifyPointHeight(block.heights, point, newHeight)
  
  return updateBlockHeights(blockIndex, newHeights)
}

// Function to find a block by entity
function findBlockByEntity(entity: Entity): number {
  return blocks.findIndex(block => block.entity === entity)
}

// Function to remove a block
function removeBlock(blockIndex: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  
  // Remove entity from engine
  engine.removeEntity(block.entity)
  
  // Remove from array
  blocks.splice(blockIndex, 1)
  
  console.log(`Removed block ${blockIndex}`)
  return true
}

// Example usage:
// // Create initial blocks
// const block1 = createBlock('555555555', Vector3.create(8, 1, 8))   // Center
// const block2 = createBlock('555335135', Vector3.create(10, 1, 8))  // East

// Later, update specific points:
// // Change corner 1 of block 0 to height 3
// updateBlockCorner(0, 1, 3)  // Changes "555555555" to "355555555"

// // Change center of block 0 to height 1
// updateBlockCenter(0, 1)     // Changes center (position 5) to height 1

// // Or use the general point function:
// updateBlockPoint(0, 5, 3)   // Update center (point 5) to height 3
// updateBlockPoint(0, 2, 5)   // Update corner 2 to height 5

// // Or directly change the entire height pattern:
// updateBlockHeights(1, '123456789')  // Changes the second block entirely

// Example of interactive point modification
export function onBlockPointClick(entity: Entity, point: number) {
  const blockIndex = findBlockByEntity(entity)
  if (blockIndex >= 0) {
    // Cycle through heights 1, 3, 5 for modifiable points
    const currentBlock = blocks[blockIndex]
    const positions = [0, 2, 4, 6, 8]  // Modifiable positions in 0-indexed
    const currentPosition = positions[point - 1]
    const currentHeight = parseInt(currentBlock.heights[currentPosition])
    
    let newHeight: number
    switch (currentHeight) {
      case 1: newHeight = 3; break
      case 3: newHeight = 5; break
      case 5: newHeight = 1; break
      default: newHeight = 1; break
    }
    
    updateBlockPoint(blockIndex, point, newHeight)
  }
}
// Sculpting functions that only raise or lower by 1 each call













// // Core sculpting functions - each modifies by exactly 1 height level
// function sculptRaise(blockIndex: number, point: number): boolean {
//   if (blockIndex < 0 || blockIndex >= blocks.length) {
//     console.error(`Block index ${blockIndex} out of range`)
//     return false
//   }
  
//   const block = blocks[blockIndex]
//   const positions = [0, 2, 4, 6, 8] // Positions for points 1,2,3,4,5
//   const position = positions[point - 1]
//   const currentHeight = parseInt(block.heights[position])
  
//   // Check if we can raise (max height is 5)
//   if (currentHeight >= 5) {
//     console.log(`❌ Cannot raise point ${point} - already at maximum height (5)`)
//     return false
//   }
  
//   // Raise by exactly 1
//   const newHeight = currentHeight + 1
//   const success = updateBlockPoint(blockIndex, point, newHeight)
  
//   if (success) {
//     console.log(`✅ Raised point ${point}: ${currentHeight} → ${newHeight}`)
//   }
  
//   return success
// }

// function sculptLower(blockIndex: number, point: number): boolean {
//   if (blockIndex < 0 || blockIndex >= blocks.length) {
//     console.error(`Block index ${blockIndex} out of range`)
//     return false
//   }
  
//   const block = blocks[blockIndex]
//   const positions = [0, 2, 4, 6, 8] // Positions for points 1,2,3,4,5
//   const position = positions[point - 1]
//   const currentHeight = parseInt(block.heights[position])
  
//   // Check if we can lower (min height is 0)
//   if (currentHeight <= 0) {
//     console.log(`❌ Cannot lower point ${point} - already at minimum height (0)`)
//     return false
//   }
  
//   // Lower by exactly 1
//   const newHeight = currentHeight - 1
//   const success = updateBlockPoint(blockIndex, point, newHeight)
  
//   if (success) {
//     console.log(`✅ Lowered point ${point}: ${currentHeight} → ${newHeight}`)
//   }
  
//   return success
// }

// // Specific corner sculpting functions
// function sculptCornerUp(blockIndex: number, corner: number): boolean {
//   if (corner < 1 || corner > 4) {
//     console.error(`Invalid corner ${corner}. Use 1-4.`)
//     return false
//   }
//   return sculptRaise(blockIndex, corner)
// }

// function sculptCornerDown(blockIndex: number, corner: number): boolean {
//   if (corner < 1 || corner > 4) {
//     console.error(`Invalid corner ${corner}. Use 1-4.`)
//     return false
//   }
//   return sculptLower(blockIndex, corner)
// }

// // Center sculpting functions
// function sculptCenterUp(blockIndex: number): boolean {
//   return sculptRaise(blockIndex, 5)
// }

// function sculptCenterDown(blockIndex: number): boolean {
//   return sculptLower(blockIndex, 5)
// }

// // Batch sculpting operations (for UI convenience)
// function batchSculpt(operations: Array<{
//   blockIndex: number,
//   point: number,
//   direction: 'up' | 'down'
// }>): boolean[] {
//   const results: boolean[] = []
  
//   operations.forEach((op, index) => {
//     console.log(`\nBatch operation ${index + 1}:`)
//     const result = op.direction === 'up' 
//       ? sculptRaise(op.blockIndex, op.point)
//       : sculptLower(op.blockIndex, op.point)
//     results.push(result)
//   })
  
//   const successful = results.filter(r => r).length
//   console.log(`\n📊 Batch complete: ${successful}/${operations.length} operations successful`)
  
//   return results
// }

// // Interactive sculpting helpers
// function showSculptingOptions(blockIndex: number): void {
//   if (blockIndex < 0 || blockIndex >= blocks.length) {
//     console.error(`Block index ${blockIndex} out of range`)
//     return
//   }
  
//   const block = blocks[blockIndex]
//   console.log(`\n🎨 Sculpting options for Block ${blockIndex} (${block.heights}):`)
//   console.log('==================================================')
  
//   // Check each point
//   const points = [
//     { name: 'Corner 1', point: 1, position: 0 },
//     { name: 'Corner 2', point: 2, position: 2 },
//     { name: 'Center',   point: 5, position: 4 },
//     { name: 'Corner 3', point: 3, position: 6 },
//     { name: 'Corner 4', point: 4, position: 8 }
//   ]
  
//   points.forEach(({ name, point, position }) => {
//     const currentHeight = parseInt(block.heights[position])
//     const canRaise = currentHeight < 5
//     const canLower = currentHeight > 0
    
//     const options = []
//     if (canRaise) options.push(`↑ raise (${currentHeight + 1})`)
//     if (canLower) options.push(`↓ lower (${currentHeight - 1})`)
    
//     const optionsText = options.length > 0 ? options.join(' or ') : 'no changes possible'
//     console.log(`  ${name}: height ${currentHeight} - ${optionsText}`)
//   })
  
//   console.log('\n💡 Usage examples:')
//   console.log(`  sculptCornerUp(${blockIndex}, 1)   // Raise corner 1`)
//   console.log(`  sculptCornerDown(${blockIndex}, 2) // Lower corner 2`) 
//   console.log(`  sculptCenterUp(${blockIndex})      // Raise center`)
//   console.log('==================================================\n')
// }

// // Advanced: Multi-step sculpting with undo capability
// class SculptingSession {
//   private history: Array<{
//     blockIndex: number,
//     oldHeights: string,
//     newHeights: string,
//     operation: string
//   }> = []
  
//   sculpRaise(blockIndex: number, point: number): boolean {
//     const oldHeights = blocks[blockIndex].heights
//     const success = sculptRaise(blockIndex, point)
    
//     if (success) {
//       this.history.push({
//         blockIndex,
//         oldHeights,
//         newHeights: blocks[blockIndex].heights,
//         operation: `Raised point ${point}`
//       })
//     }
    
//     return success
//   }
  
//   sculptLower(blockIndex: number, point: number): boolean {
//     const oldHeights = blocks[blockIndex].heights
//     const success = sculptLower(blockIndex, point)
    
//     if (success) {
//       this.history.push({
//         blockIndex,
//         oldHeights,
//         newHeights: blocks[blockIndex].heights,
//         operation: `Lowered point ${point}`
//       })
//     }
    
//     return success
//   }
  
//   undo(): boolean {
//     if (this.history.length === 0) {
//       console.log('❌ No operations to undo')
//       return false
//     }
    
//     const lastOp = this.history.pop()!
//     const success = updateBlockHeights(lastOp.blockIndex, lastOp.oldHeights)
    
//     if (success) {
//       console.log(`↩️  Undid: ${lastOp.operation}`)
//       console.log(`   ${lastOp.newHeights} → ${lastOp.oldHeights}`)
//     }
    
//     return success
//   }
  
//   getHistory(): typeof this.history {
//     return [...this.history]
//   }
  
//   clearHistory(): void {
//     this.history = []
//     console.log('🗑️  Sculpting history cleared')
//   }
// }


// Enhanced sculpting functions with edge height constraints
// Edge positions (2,4,6,8) can only have heights 1, 3, or 5
// Corner and center positions (1,3,5,7,9) can have any height 0-5




function isEdgePosition(gridPosition: number): boolean {
  // Grid layout:
  // 1 2 3
  // 4 5 6  
  // 7 8 9
  // Edge positions are 2, 4, 6, 8
  return [2, 4, 6, 8].includes(gridPosition)
}

function isValidEdgeHeight(height: number): boolean {
  // Edges can only be height 1, 3, or 5
  return [1, 3, 5].includes(height)
}

function getNextValidEdgeHeight(currentHeight: number, direction: 'up' | 'down'): number | null {
  const validHeights = [1, 3, 5]
  const currentIndex = validHeights.indexOf(currentHeight)
  
  if (currentIndex === -1) {
    // Current height is invalid for edge, return closest valid height
    if (currentHeight < 1) return 1
    if (currentHeight === 2) return direction === 'up' ? 3 : 1
    if (currentHeight === 4) return direction === 'up' ? 5 : 3
    if (currentHeight > 5) return 5
  }
  
  if (direction === 'up') {
    // Go to next higher valid height
    return currentIndex < validHeights.length - 1 ? validHeights[currentIndex + 1] : null
  } else {
    // Go to next lower valid height
    return currentIndex > 0 ? validHeights[currentIndex - 1] : null
  }
}

// Function to show exact mappings for debugging
function debugPointMappings(): void {
  console.log('🔍 Point to Grid/Index Mappings:')
  console.log('Grid layout:')
  console.log('1 2 3')
  console.log('4 5 6') 
  console.log('7 8 9')
  console.log('')
  console.log('Array indices:')
  console.log('0 1 2')
  console.log('3 4 5')
  console.log('6 7 8')
  console.log('')
  console.log('Point mappings:')
  console.log('  Point 1 (corner top-left):     grid 1, index 0')
  console.log('  Point 2 (corner top-right):    grid 3, index 2') 
  console.log('  Point 3 (corner bottom-left):  grid 7, index 6')
  console.log('  Point 4 (corner bottom-right): grid 9, index 8')
  console.log('  Point 5 (center):              grid 5, index 4')
  console.log('')
}

function sculptRaiseWithConstraints(blockIndex: number, point: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  if (point < 1 || point > 5) {
    console.error(`Invalid point ${point}. Use 1-5 (1-4 for corners, 5 for center).`)
    return false
  }
  
  const block = blocks[blockIndex]
  
  // CORRECTED mapping to match your expected behavior
  // Based on your expectation that corner 3 should change position 6
  const pointToIndex: Record<number, number> = { 
    1: 0, // Corner 1 -> top-left (index 0)
    2: 2, // Corner 2 -> top-right (index 2)  
    3: 6, // Corner 3 -> bottom-left (index 6)
    4: 8, // Corner 4 -> bottom-right (index 8)
    5: 4  // Center -> center (index 4)
  }
  
  // Grid positions for edge detection
  const pointToGrid: Record<number, number> = { 
    1: 1, // Grid position 1
    2: 3, // Grid position 3
    3: 7, // Grid position 7
    4: 9, // Grid position 9
    5: 5  // Grid position 5
  }
  
  const gridPosition = pointToGrid[point]
  const arrayIndex = pointToIndex[point]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
  console.log(`🐛 Debug: Point ${point} -> Grid ${gridPosition}, Index ${arrayIndex}, Current height ${currentHeight}`)
  
  let newHeight: number
  
  if (isEdgePosition(gridPosition)) {
    // This is an edge position - use constrained height progression
    const nextHeight = getNextValidEdgeHeight(currentHeight, 'up')
    if (nextHeight === null) {
      console.log(`❌ Cannot raise edge point ${point} - already at maximum valid height (5)`)
      return false
    }
    newHeight = nextHeight
  } else {
    // This is a corner or center - normal increment by 1
    if (currentHeight >= 5) {
      console.log(`❌ Cannot raise point ${point} - already at maximum height (5)`)
      return false
    }
    newHeight = currentHeight + 1
  }
  
  const success = updateBlockPoint(blockIndex, point, newHeight)
  
  if (success) {
    const pointType = isEdgePosition(gridPosition) ? 'edge' : (point === 5 ? 'center' : 'corner')
    console.log(`✅ Raised ${pointType} point ${point}: ${currentHeight} → ${newHeight}`)
  }
  
  return success
}

function sculptLowerWithConstraints(blockIndex: number, point: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  if (point < 1 || point > 5) {
    console.error(`Invalid point ${point}. Use 1-5 (1-4 for corners, 5 for center).`)
    return false
  }
  
  const block = blocks[blockIndex]
  
  // CORRECTED mapping to match your expected behavior
  const pointToIndex: Record<number, number> = { 
    1: 0, // Corner 1 -> top-left (index 0)
    2: 2, // Corner 2 -> top-right (index 2)  
    3: 6, // Corner 3 -> bottom-left (index 6)
    4: 8, // Corner 4 -> bottom-right (index 8)
    5: 4  // Center -> center (index 4)
  }
  
  // Grid positions for edge detection
  const pointToGrid: Record<number, number> = { 
    1: 1, // Grid position 1
    2: 3, // Grid position 3
    3: 7, // Grid position 7
    4: 9, // Grid position 9
    5: 5  // Grid position 5
  }
  
  const gridPosition = pointToGrid[point]
  const arrayIndex = pointToIndex[point]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
  console.log(`🐛 Debug: Point ${point} -> Grid ${gridPosition}, Index ${arrayIndex}, Current height ${currentHeight}`)
  
  let newHeight: number
  
  if (isEdgePosition(gridPosition)) {
    // This is an edge position - use constrained height progression
    const nextHeight = getNextValidEdgeHeight(currentHeight, 'down')
    if (nextHeight === null) {
      console.log(`❌ Cannot lower edge point ${point} - already at minimum valid height (1)`)
      return false
    }
    newHeight = nextHeight
  } else {
    // This is a corner or center - normal decrement by 1
    if (currentHeight <= 0) {
      console.log(`❌ Cannot lower point ${point} - already at minimum height (0)`)
      return false
    }
    newHeight = currentHeight - 1
  }
  
  const success = updateBlockPoint(blockIndex, point, newHeight)
  
  if (success) {
    const pointType = isEdgePosition(gridPosition) ? 'edge' : (point === 5 ? 'center' : 'corner')
    console.log(`✅ Lowered ${pointType} point ${point}: ${currentHeight} → ${newHeight}`)
  }
  
  return success
}

// Updated convenience functions
function sculptCornerUp(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4.`)
    return false
  }
  return sculptRaiseWithConstraints(blockIndex, corner)
}

function sculptCornerDown(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4.`)
    return false
  }
  return sculptLowerWithConstraints(blockIndex, corner)
}

function sculptCenterUp(blockIndex: number): boolean {
  return sculptRaiseWithConstraints(blockIndex, 5)
}

function sculptCenterDown(blockIndex: number): boolean {
  return sculptLowerWithConstraints(blockIndex, 5)
}

// Function to show valid height transitions
function showValidTransitions(blockIndex: number): void {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return
  }
  
  const block = blocks[blockIndex]
  console.log(`\n🎨 Valid sculpting transitions for Block ${blockIndex} (${block.heights}):`)
  console.log('=============================================================')
  
  const points = [
    { name: 'Corner 1', point: 1, grid: 1, index: 0 },
    { name: 'Edge 2',   point: 2, grid: 3, index: 2 },
    { name: 'Corner 3', point: 3, grid: 7, index: 6 },
    { name: 'Edge 4',   point: 4, grid: 9, index: 8 },
    { name: 'Center',   point: 5, grid: 5, index: 4 }
  ]
  
  points.forEach(({ name, point, grid, index }) => {
    const currentHeight = parseInt(block.heights[index])
    const isEdge = isEdgePosition(grid)
    
    if (isEdge) {
      // Edge position - show valid height jumps
      const upHeight = getNextValidEdgeHeight(currentHeight, 'up')
      const downHeight = getNextValidEdgeHeight(currentHeight, 'down')
      
      const options = []
      if (downHeight !== null) options.push(`↓ ${downHeight}`)
      if (upHeight !== null) options.push(`↑ ${upHeight}`)
      
      const validHeights = `(valid: 1,3,5)`
      const optionsText = options.length > 0 ? options.join(' or ') : 'no changes possible'
      console.log(`  ${name}: height ${currentHeight} ${validHeights} - ${optionsText}`)
    } else {
      // Corner or center - show normal +/-1
      const options = []
      if (currentHeight > 0) options.push(`↓ ${currentHeight - 1}`)
      if (currentHeight < 5) options.push(`↑ ${currentHeight + 1}`)
      
      const validHeights = `(valid: 0-5)`
      const optionsText = options.length > 0 ? options.join(' or ') : 'no changes possible'
      console.log(`  ${name}: height ${currentHeight} ${validHeights} - ${optionsText}`)
    }
  })
  
  console.log('\n💡 Usage examples:')
  console.log(`  sculptCornerUp(${blockIndex}, 1)   // Raise corner 1 by 1`)
  console.log(`  sculptCornerUp(${blockIndex}, 2)   // Raise edge 2 (1→3, 3→5)`)
  console.log(`  sculptCenterDown(${blockIndex})    // Lower center by 1`)
  console.log('=============================================================\n')
}

// Validation function to check if a block follows edge constraints
function validateBlockConstraints(heights: string): {
  valid: boolean,
  violations: string[]
} {
  const violations: string[] = []
  
  // Check edge positions (indices 1, 3, 5, 7 in the string)
  const edgePositions = [
    { index: 1, name: 'top edge' },
    { index: 3, name: 'left edge' },
    { index: 5, name: 'right edge' },
    { index: 7, name: 'bottom edge' }
  ]
  
  edgePositions.forEach(({ index, name }) => {
    const height = parseInt(heights[index])
    if (!isValidEdgeHeight(height)) {
      violations.push(`${name} (position ${index + 1}): height ${height} invalid (must be 1, 3, or 5)`)
    }
  })
  
  return {
    valid: violations.length === 0,
    violations
  }
}


// Debug function to test the current mapping
function debugBlockModification(blockIndex: number, point: number): void {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return
  }
  
  const block = blocks[blockIndex]
  console.log(`\n🔍 Debug Analysis for Block ${blockIndex}:`)
  console.log(`Current heights: ${block.heights}`)
  console.log(`Positions:       012345678`)
  console.log('')
  
  // Test our mapping
  const pointToIndex: Record<number, number> = { 
    1: 0, // Corner 1 -> top-left (position 0)
    2: 2, // Corner 2 -> top-right (position 2)  
    3: 6, // Corner 3 -> bottom-left (position 6)
    4: 8, // Corner 4 -> bottom-right (position 8)
    5: 4  // Center -> center (position 4)
  }
  
  const arrayIndex = pointToIndex[point]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
  console.log(`Point ${point} should map to:`)
  console.log(`  Array index: ${arrayIndex}`)
  console.log(`  Current height at that position: ${currentHeight}`)
  console.log(`  Expected new position for '555555355': position 6 = 3`)
  console.log('')
}

// Create a direct modification function that bypasses updateBlockPoint
function directModifyBlock(blockIndex: number, point: number, newHeight: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  const oldHeights = block.heights
  
  // Direct mapping - exactly what you expect
  const pointToIndex: Record<number, number> = { 
    1: 0, // Corner 1 -> array position 0
    2: 2, // Corner 2 -> array position 2  
    3: 6, // Corner 3 -> array position 6
    4: 8, // Corner 4 -> array position 8
    5: 4  // Center -> array position 4
  }
  
  const arrayIndex = pointToIndex[point]
  if (arrayIndex === undefined) {
    console.error(`Invalid point: ${point}`)
    return false
  }
  
  // Modify the heights string directly
  const heightArray = oldHeights.split('')
  heightArray[arrayIndex] = newHeight.toString()
  const newHeights = heightArray.join('')
  
  console.log(`\n🔧 Direct modification:`)
  console.log(`  Block ${blockIndex}: ${oldHeights} → ${newHeights}`)
  console.log(`  Point ${point} (position ${arrayIndex}): ${oldHeights[arrayIndex]} → ${newHeight}`)
  
  // Update the block heights directly
  block.heights = newHeights
  
  // Update the GltfContainer component to load new GLB
  GltfContainer.createOrReplace(block.entity, {
    src: `assets/blocks/aetheria_${newHeights}.glb`
  })
  
  console.log(`✅ Block updated successfully`)
  return true
}

// Corrected sculpting functions that use direct modification
function sculptCornerDownDirect(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4.`)
    return false
  }
  
  debugBlockModification(blockIndex, corner)
  
  const block = blocks[blockIndex]
  const pointToIndex: Record<number, number> = { 1: 0, 2: 2, 3: 6, 4: 8, 5: 4 }
  const arrayIndex = pointToIndex[corner]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
  // For corners, check if we should use edge-style jumping or normal decrement
  // Based on your expectation (5 → 3), it seems corners should use edge-style jumping
  
  let newHeight: number
  const validCornerHeights = [1, 3, 5] // Same as edges
  const currentIndex = validCornerHeights.indexOf(currentHeight)
  
  if (currentIndex <= 0) {
    console.log(`❌ Cannot lower corner ${corner} - already at minimum (1)`)
    return false
  }
  
  newHeight = validCornerHeights[currentIndex - 1] // Jump to previous valid height
  
  console.log(`🎨 Sculpting corner ${corner}: ${currentHeight} → ${newHeight}`)
  return directModifyBlock(blockIndex, corner, newHeight)
}

function sculptCornerUpDirect(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4.`)
    return false
  }
  
  const block = blocks[blockIndex]
  const pointToIndex: Record<number, number> = { 1: 0, 2: 2, 3: 6, 4: 8, 5: 4 }
  const arrayIndex = pointToIndex[corner]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
  let newHeight: number
  const validCornerHeights = [1, 3, 5] // Same as edges
  const currentIndex = validCornerHeights.indexOf(currentHeight)
  
  if (currentIndex >= validCornerHeights.length - 1) {
    console.log(`❌ Cannot raise corner ${corner} - already at maximum (5)`)
    return false
  }
  
  newHeight = validCornerHeights[currentIndex + 1] // Jump to next valid height
  
  console.log(`🎨 Sculpting corner ${corner}: ${currentHeight} → ${newHeight}`)
  return directModifyBlock(blockIndex, corner, newHeight)
}

// Test function
function testCornerMapping(): void {
  console.log('🧪 Testing corner mapping...')
  console.log('Expected behavior:')
  console.log('  555555555 → sculptCornerDown(x, 3) → 555555355')
  console.log('  This means corner 3 should modify position 6')
  console.log('')
  console.log('Current mapping:')
  console.log('  Corner 1 → position 0 (top-left)')
  console.log('  Corner 2 → position 2 (top-right)')  
  console.log('  Corner 3 → position 6 (bottom-left)')
  console.log('  Corner 4 → position 8 (bottom-right)')
  console.log('')
}

// // Export sculpting functions
// export {
//   sculptRaise,
//   sculptLower,
//   sculptCornerUp,
//   sculptCornerDown,
//   sculptCenterUp,
//   sculptCenterDown,
//   batchSculpt,
//   showSculptingOptions,
//   SculptingSession
// }

// Example usage:
/*
// Basic sculpting
sculptCornerUp(0, 1)     // Raise corner 1 by 1
sculptCornerDown(0, 2)   // Lower corner 2 by 1
sculptCenterUp(0)        // Raise center by 1

// Show options before sculpting
showSculptingOptions(0)

// Advanced sculpting with undo
const session = new SculptingSession()
session.sculpRaise(0, 1)
session.sculpLower(0, 2)
session.undo()  // Undoes the last operation
*/


// Export for external use
export { blocks, createBlock, updateBlockHeights, updateBlockCorner, updateBlockCenter, updateBlockPoint, removeBlock,  sculptRaiseWithConstraints as sculptRaise,
  sculptLowerWithConstraints as sculptLower,
  sculptCornerUp,
  sculptCornerDown,
  sculptCenterUp,
  sculptCenterDown,
  showValidTransitions,
  validateBlockConstraints,
  isEdgePosition,
  isValidEdgeHeight,
  getNextValidEdgeHeight,
  debugPointMappings,
  debugBlockModification,
  directModifyBlock,
  sculptCornerDownDirect,
  sculptCornerUpDirect,
  testCornerMapping }