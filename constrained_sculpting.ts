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
  
  // Map point numbers to grid positions and array indices
  const pointToGrid = { 1: 1, 2: 3, 3: 7, 4: 9, 5: 5 }
  const pointToIndex = { 1: 0, 2: 2, 3: 6, 4: 8, 5: 4 }
  
  const gridPosition = pointToGrid[point]
  const arrayIndex = pointToIndex[point]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
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
  
  // Map point numbers to grid positions and array indices
  const pointToGrid = { 1: 1, 2: 3, 3: 7, 4: 9, 5: 5 }
  const pointToIndex = { 1: 0, 2: 2, 3: 6, 4: 8, 5: 4 }
  
  const gridPosition = pointToGrid[point]
  const arrayIndex = pointToIndex[point]
  const currentHeight = parseInt(block.heights[arrayIndex])
  
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

// Export functions
export {
  sculptRaiseWithConstraints as sculptRaise,
  sculptLowerWithConstraints as sculptLower,
  sculptCornerUp,
  sculptCornerDown,
  sculptCenterUp,
  sculptCenterDown,
  showValidTransitions,
  validateBlockConstraints,
  isEdgePosition,
  isValidEdgeHeight,
  getNextValidEdgeHeight
}

/*
Example usage with edge constraints:

// Start with block "555355135"
// Grid layout:
// 5 5 5  <- top edge (5) is valid
// 3 5 5  <- left edge (3) and right edge (5) are valid
// 1 3 5  <- bottom edge (3) is valid

showValidTransitions(0)
// Shows:
//   Corner 1: height 5 (valid: 0-5) - ↓ 4
//   Edge 2: height 5 (valid: 1,3,5) - ↓ 3
//   Corner 3: height 1 (valid: 0-5) - ↓ 0 or ↑ 2
//   Edge 4: height 3 (valid: 1,3,5) - ↓ 1 or ↑ 5
//   Center: height 5 (valid: 0-5) - ↓ 4

sculptCornerUp(0, 2)   // Raises edge from 5 to... still 5 (already max)
sculptCornerDown(0, 2) // Lowers edge from 5 to 3 (skips 4)
sculptCornerDown(0, 4) // Lowers edge from 3 to 1
*/