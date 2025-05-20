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
    src: `assets/blocks/aetheria_${heights}.glb`
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
// Create initial blocks
const block1 = createBlock('555555555', Vector3.create(8, 1, 8))   // Center
const block2 = createBlock('555335135', Vector3.create(10, 1, 8))  // East

// Later, update specific points:
// Change corner 1 of block 0 to height 3
updateBlockCorner(0, 1, 3)  // Changes "555555555" to "355555555"

// Change center of block 0 to height 1
updateBlockCenter(0, 1)     // Changes center (position 5) to height 1

// Or use the general point function:
updateBlockPoint(0, 5, 3)   // Update center (point 5) to height 3
updateBlockPoint(0, 2, 5)   // Update corner 2 to height 5

// Or directly change the entire height pattern:
updateBlockHeights(1, '123456789')  // Changes the second block entirely

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

// Export for external use
export { blocks, createBlock, updateBlockHeights, updateBlockCorner, updateBlockCenter, updateBlockPoint, removeBlock }