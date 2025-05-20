import { engine, Transform, GltfContainer, Entity, InputAction, PointerEvents, PointerEventType, Ray, RaycastResult } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { inputSystem } from '@dcl/sdk/ecs'

// Block data structure (from previous code)
type BlockData = {
  entity: Entity
  heights: string  // e.g., "3331" (4 corners: NW, NE, SW, SE)
  position: Vector3
}

// Array to store all blocks with their data
const blocks: BlockData[] = []

// Function to create a block using new 4-corner system
function createBlock(heights: string, position: Vector3): BlockData {
  // Validation logic from previous code...
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
  
  // Add GltfContainer component
  GltfContainer.create(entity, {
    src: `assets/blocks/aetheria_clean_${heights}.glb`
  })
  
  // Make the block interactive with pointer events
  addPointerEventsToBlock(entity)
  
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

// Function to find a block by entity
function findBlockByEntity(entity: Entity): number {
  return blocks.findIndex(block => block.entity === entity)
}

// ==== RAYCAST AND POINTER EVENTS SYSTEM ====

// Add pointer events to make a block clickable
function addPointerEventsToBlock(entity: Entity): void {
  // Add pointer events component to the entity
  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: { button: InputAction.IA_POINTER, hoverText: 'Select Block' }
      }
    ]
  })
}

// Track the currently selected block
let selectedBlockIndex: number = -1

// Setup the raycast system
export function setupRaycastSystem(): void {
  // Handle pointer down events from any entity with PointerEvents
  inputSystem.onPointerDown(
    { 
      entity: undefined, // Listen for any entity
      button: InputAction.IA_POINTER // Left mouse click
    },
    (event) => {
      // Get the entity that was clicked
      const clickedEntity = event.entity
      
      // Find the block index
      const blockIndex = findBlockByEntity(clickedEntity)
      
      if (blockIndex !== -1) {
        // We found a block
        const block = blocks[blockIndex]
        
        // Update selected block
        selectedBlockIndex = blockIndex
        
        // Print block info to console
        console.log('\n🔍 Block Selected:')
        console.log(`  Index: ${blockIndex}`)
        console.log(`  Heights: ${block.heights}`)
        console.log(`  Position: (${block.position.x}, ${block.position.y}, ${block.position.z})`)
        
        // You can also call your showSculptingOptions here
        showSculptingOptions(blockIndex)
      } else {
        console.log(`Clicked entity is not a recognized block`)
        selectedBlockIndex = -1
      }
    }
  )
  
  console.log('✅ Raycast system initialized. Click on blocks to select them.')
}

// Function to manually cast a ray from the camera/avatar
export function castRayFromCamera(): void {
  // Get the camera position and direction
  // Note: In DCL SDK, you might need to use the Camera component to get the exact position
  // This is a simplified version
  
  // Create a raycast query from camera's position and direction
  // This would normally come from camera/avatar position
  const raycast = Ray.create()
  
  // Process the raycast result
  const hit = Ray.hitFirst(raycast)
  
  if (hit) {
    const hitEntity = hit.entity
    const blockIndex = findBlockByEntity(hitEntity)
    
    if (blockIndex !== -1) {
      console.log(`\n🔍 Ray hit block ${blockIndex} (${blocks[blockIndex].heights})`)
      selectedBlockIndex = blockIndex
    } else {
      console.log(`Ray didn't hit any known block`)
    }
  } else {
    console.log(`Ray didn't hit anything`)
  }
}

// Function to get the currently selected block index
export function getSelectedBlockIndex(): number {
  return selectedBlockIndex
}

// Function to get selected block data
export function getSelectedBlock(): BlockData | null {
  if (selectedBlockIndex === -1) return null
  return blocks[selectedBlockIndex]
}

// Function to show sculpting options for the selected block
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

// ===== KEYBOARD INPUT FOR SCULPTING =====

// Set up keyboard controls for sculpting the selected block
export function setupSculptingControls(): void {
  // 1-4 keys to select corners
  // Q to lower selected corner, E to raise selected corner
  
  // Track which corner is selected (1-4)
  let selectedCorner = 1
  
  // Handle number keys 1-4 to select corners
  inputSystem.onKeyDown({ key: 'KEY_1' }, () => { 
    selectedCorner = 1; 
    console.log(`Selected corner: 1 (NW)`);
  })
  
  inputSystem.onKeyDown({ key: 'KEY_2' }, () => { 
    selectedCorner = 2; 
    console.log(`Selected corner: 2 (NE)`);
  })
  
  inputSystem.onKeyDown({ key: 'KEY_3' }, () => { 
    selectedCorner = 3; 
    console.log(`Selected corner: 3 (SW)`);
  })
  
  inputSystem.onKeyDown({ key: 'KEY_4' }, () => { 
    selectedCorner = 4; 
    console.log(`Selected corner: 4 (SE)`);
  })
  
  // Q to lower the selected corner
  inputSystem.onKeyDown({ key: 'KEY_Q' }, () => {
    if (selectedBlockIndex !== -1) {
      console.log(`Lowering corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerDown(selectedBlockIndex, selectedCorner)
    } else {
      console.log('No block selected. Click a block first!')
    }
  })
  
  // E to raise the selected corner
  inputSystem.onKeyDown({ key: 'KEY_E' }, () => {
    if (selectedBlockIndex !== -1) {
      console.log(`Raising corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerUp(selectedBlockIndex, selectedCorner)
    } else {
      console.log('No block selected. Click a block first!')
    }
  })
  
  console.log('✅ Sculpting controls initialized:')
  console.log('  - Click on a block to select it')
  console.log('  - Press 1-4 to select a corner')
  console.log('  - Press Q to lower the selected corner')
  console.log('  - Press E to raise the selected corner')
}

// ===== REST OF THE FUNCTIONS FROM PREVIOUS CODE =====

// Function to update a block's GLB by changing its heights
function updateBlockHeights(blockIndex: number, newHeights: string): boolean {
  // Implementation same as previous code...
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

// Helper function to modify corner heights
function modifyCornerHeight(heights: string, corner: number, newHeight: number): string {
  // Implementation same as previous code...
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

// Function to update a specific corner of a block
function updateBlockCorner(blockIndex: number, corner: number, newHeight: number): boolean {
  // Implementation same as previous code...
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

// Sculpting functions
function sculptCornerUp(blockIndex: number, corner: number): boolean {
  // Implementation same as previous code...
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
  // Implementation same as previous code...
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

// Function to remove a block
function removeBlock(blockIndex: number): boolean {
  // Implementation same as previous code...
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

// Show all blocks
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

// Example setup function
function setupExampleBlocks(): void {
  console.log('🎮 Setting up example blocks...')
  
  // Create some example blocks using the new 4-corner system
  try {
    const block1 = createBlock('3333', Vector3.create(0, 1, 0))    // Full cube
    const block2 = createBlock('3331', Vector3.create(2, 1, 0))    // SE corner lower
    const block3 = createBlock('3113', Vector3.create(4, 1, 0))    // NE and SW corners lower
    const block4 = createBlock('1323', Vector3.create(6, 1, 0))    // Mixed heights
    
    console.log('\n✅ Example blocks created successfully!')
    showBlocks()
    
    // Setup raycast and input controls
    setupRaycastSystem()
    setupSculptingControls()
    
  } catch (error) {
    console.error('❌ Error setting up example blocks:', error)
  }
}

// Main initialization function for the scene
export function initAetheriaBlockSystem(): void {
  console.log('🌐 Initializing Aetheria Block System...')
  
  // Setup raycast system
  setupRaycastSystem()
  
  // Setup sculpting controls
  setupSculptingControls()
  
  console.log('✅ Aetheria Block System ready!')
}

// Export all functions
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
  setupExampleBlocks
}

// Uncomment to automatically initialize when this module is imported
// initAetheriaBlockSystem()