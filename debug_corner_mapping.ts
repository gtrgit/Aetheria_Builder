// Let's debug the issue by checking the underlying updateBlockPoint function
// and create a corrected version that matches your expected behavior

// First, let's understand your corner numbering system from the expected result:
// Starting: 555555555 (positions 0,1,2,3,4,5,6,7,8)
// Expected: 555555355 (position 6 changes from 5 to 3)
// This means corner 3 should map to array index 6

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

export { 
  debugBlockModification,
  directModifyBlock,
  sculptCornerDownDirect,
  sculptCornerUpDirect,
  testCornerMapping
}

// To test: 
// testCornerMapping()
// debugBlockModification(11, 3)
// sculptCornerDownDirect(11, 3)  // Should give you 555555355