import { engine, Transform, GltfContainer, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

// Store block data with entities - updated for 4-corner blocks
type BlockData = {
  entity: Entity
  heights: string  // e.g., "3331" (4 corners: NW, NE, SW, SE)
  position: Vector3
}

// Array to store all blocks with their data
const blocks: BlockData[] = []

// Function to create a block using new 4-corner system
function createBlock(heights: string, position: Vector3): BlockData {
  // Validate input - should be exactly 4 digits
  if (heights.length !== 4) {
    throw new Error(`Invalid heights "${heights}". Must be exactly 4 digits (NW, NE, SW, SE)`)
  }
  
  // Validate each height is 1-3 (no zeros for clean blocks)
  for (let i = 0; i < heights.length; i++) {
    const height = parseInt(heights[i])
    if (height < 1 || height > 3) {
      throw new Error(`Invalid height ${height} at position ${i}. Must be 1-3`)
    }
  }
  
  
  const entity = engine.addEntity()
  
  // Add Transform component
  Transform.create(entity, {
    position: position,
    scale: Vector3.create(1, 1, 1),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  
  // Add GltfContainer component - using the new clean block naming
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
  console.log(`✅ Created block ${heights} at position (${position.x}, ${position.y}, ${position.z})`)
  return blockData
}

// Function to update a block's GLB by changing its heights
function updateBlockHeights(blockIndex: number, newHeights: string): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  // Validate new heights
  if (newHeights.length !== 4) {
    console.error(`Invalid heights "${newHeights}". Must be exactly 4 digits`)
    return false
  }
  
  for (let i = 0; i < newHeights.length; i++) {
    const height = parseInt(newHeights[i])
    if (height < 1 || height > 3) {
      console.error(`Invalid height ${height} at position ${i}. Must be 1-3`)
      return false
    }
  }
  
  const block = blocks[blockIndex]
  const oldHeights = block.heights
  
  // Update the heights data
  block.heights = newHeights
  
  // Update the GltfContainer component to load new GLB
  GltfContainer.createOrReplace(block.entity, {
    src: `assets/blocks/aetheria_clean_${newHeights}.glb`
  })
  
  console.log(`✅ Updated block ${blockIndex}: ${oldHeights} → ${newHeights}`)
  return true
}

// Helper function to modify corner heights (1-4 for corners)
function modifyCornerHeight(heights: string, corner: number, newHeight: number): string {
  // Corners are numbered 1-4: NW, NE, SW, SE
  // heights[0] = NW (corner 1)
  // heights[1] = NE (corner 2)  
  // heights[2] = SW (corner 3)
  // heights[3] = SE (corner 4)
  
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4 (1=NW, 2=NE, 3=SW, 4=SE).`)
    return heights
  }
  
  if (newHeight < 1 || newHeight > 3) {
    console.error(`Invalid height ${newHeight}. Use 1-3.`)
    return heights
  }
  
  // Convert heights string to array
  const heightArray = heights.split('').map(h => parseInt(h))
  
  // Update the corner (convert 1-based to 0-based index)
  heightArray[corner - 1] = newHeight
  
  // Convert back to string
  return heightArray.join('')
}

// Function to update a specific corner of a block (corners 1-4)
function updateBlockCorner(blockIndex: number, corner: number, newHeight: number): boolean {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  const newHeights = modifyCornerHeight(block.heights, corner, newHeight)
  
  if (newHeights === block.heights) {
    return false // Invalid input, heights unchanged
  }
  
  return updateBlockHeights(blockIndex, newHeights)
}

// Sculpting functions for 4-corner blocks
function sculptCornerUp(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4 (1=NW, 2=NE, 3=SW, 4=SE).`)
    return false
  }
  
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  const currentHeight = parseInt(block.heights[corner - 1])
  
  // Check if we can raise (max height is 3)
  if (currentHeight >= 3) {
    console.log(`❌ Cannot raise corner ${corner} - already at maximum height (3)`)
    return false
  }
  
  // Raise by exactly 1
  const newHeight = currentHeight + 1
  const success = updateBlockCorner(blockIndex, corner, newHeight)
  
  if (success) {
    const cornerNames = ['', 'NW', 'NE', 'SW', 'SE']
    console.log(`✅ Raised corner ${corner} (${cornerNames[corner]}): ${currentHeight} → ${newHeight}`)
  }
  
  return success
}

function sculptCornerDown(blockIndex: number, corner: number): boolean {
  if (corner < 1 || corner > 4) {
    console.error(`Invalid corner ${corner}. Use 1-4 (1=NW, 2=NE, 3=SW, 4=SE).`)
    return false
  }
  
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return false
  }
  
  const block = blocks[blockIndex]
  const currentHeight = parseInt(block.heights[corner - 1])
  
  // Check if we can lower (min height is 1)
  if (currentHeight <= 1) {
    console.log(`❌ Cannot lower corner ${corner} - already at minimum height (1)`)
    return false
  }
  
  // Lower by exactly 1
  const newHeight = currentHeight - 1
  const success = updateBlockCorner(blockIndex, corner, newHeight)
  
  if (success) {
    const cornerNames = ['', 'NW', 'NE', 'SW', 'SE']
    console.log(`✅ Lowered corner ${corner} (${cornerNames[corner]}): ${currentHeight} → ${newHeight}`)
  }
  
  return success
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
  
  console.log(`✅ Removed block ${blockIndex}`)
  return true
}

// Function to visualize current blocks
function showBlocks(): void {
  console.log(`\n📦 Current blocks (${blocks.length} total):`)
  console.log('================================================')
  
  if (blocks.length === 0) {
    console.log('  No blocks created yet.')
  } else {
    blocks.forEach((block, index) => {
      const pos = block.position
      console.log(`  Block ${index}: ${block.heights} at (${pos.x}, ${pos.y}, ${pos.z})`)
    })
  }
  
  console.log('================================================\n')
}

// Function to show sculpting options for a block
function showSculptingOptions(blockIndex: number): void {
  if (blockIndex < 0 || blockIndex >= blocks.length) {
    console.error(`Block index ${blockIndex} out of range`)
    return
  }
  
  const block = blocks[blockIndex]
  console.log(`\n🎨 Sculpting options for Block ${blockIndex} (${block.heights}):`)
  console.log('==================================================')
  
  const cornerNames = ['NW', 'NE', 'SW', 'SE']
  const heights = block.heights.split('').map(Number)
  
  heights.forEach((height, index) => {
    const corner = index + 1
    const cornerName = cornerNames[index]
    
    const options = []
    if (height > 1) options.push(`↓ lower (${height - 1})`)
    if (height < 3) options.push(`↑ raise (${height + 1})`)
    
    const optionsText = options.length > 0 ? options.join(' or ') : 'no changes possible'
    console.log(`  Corner ${corner} (${cornerName}): height ${height} - ${optionsText}`)
  })
  
  console.log('\n💡 Usage examples:')
  console.log(`  sculptCornerUp(${blockIndex}, 1)   // Raise NW corner`)
  console.log(`  sculptCornerDown(${blockIndex}, 2) // Lower NE corner`) 
  console.log(`  updateBlockCorner(${blockIndex}, 3, 2) // Set SW corner to height 2`)
  console.log('==================================================\n')
}

// Interactive click handler for block corners
export function onBlockCornerClick(entity: Entity, corner: number) {
  const blockIndex = findBlockByEntity(entity)
  if (blockIndex >= 0) {
    // Cycle through heights 1, 2, 3 for the clicked corner
    const currentBlock = blocks[blockIndex]
    const currentHeight = parseInt(currentBlock.heights[corner - 1])
    
    let newHeight: number
    switch (currentHeight) {
      case 1: newHeight = 2; break
      case 2: newHeight = 3; break
      case 3: newHeight = 1; break
      default: newHeight = 1; break
    }
    
    updateBlockCorner(blockIndex, corner, newHeight)
  }
}

// Validation function to ensure block follows the 4-corner format
function validateBlock(heights: string): {
  valid: boolean,
  errors: string[]
} {
  const errors: string[] = []
  
  if (heights.length !== 4) {
    errors.push(`Wrong length: expected 4 digits, got ${heights.length}`)
  } else {
    for (let i = 0; i < 4; i++) {
      const height = parseInt(heights[i])
      if (isNaN(height) || height < 1 || height > 3) {
        const cornerNames = ['NW', 'NE', 'SW', 'SE']
        errors.push(`Invalid height ${heights[i]} for ${cornerNames[i]} corner (must be 1-3)`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Example usage and setup function
function setupExampleBlocks(): void {
  console.log('🎮 Setting up example blocks...')
  
  // Create some example blocks using the new 4-corner system
  try {
    const block1 = createBlock('3333', Vector3.create(1, 1, 1))    // Full cube
    const block2 = createBlock('3331', Vector3.create(2, 1, 1))    // SE corner lower
    const block3 = createBlock('3113', Vector3.create(4, 1, 1))    // NE and SW corners lower
    const block4 = createBlock('1323', Vector3.create(6, 1, 1))    // Mixed heights
    
    console.log('\n✅ Example blocks created successfully!')
    showBlocks()
    
    // Demonstrate sculpting
    console.log('🎨 Demonstrating sculpting...')
    sculptCornerDown(1, 4)  // Lower SE corner of block2 from 1 to... wait, can't go lower!
    sculptCornerUp(1, 4)    // Raise SE corner of block2 from 1 to 2
    
    showBlocks()
    
  } catch (error) {
    console.error('❌ Error setting up example blocks:', error)
  }
}

// Export all the functions for use in your scene
export {
  blocks,
  createBlock,
  updateBlockHeights,
  updateBlockCorner,
  removeBlock,
  findBlockByEntity,
  sculptCornerUp,
  sculptCornerDown,
  showBlocks,
  showSculptingOptions,
  validateBlock,
  setupExampleBlocks
}

// Uncomment this line to automatically create example blocks when the module loads
// setupExampleBlocks()