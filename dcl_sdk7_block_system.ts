import { engine, Transform, GltfContainer, Entity, InputAction, PointerEvents, PointerEventType, ColliderLayer, MeshCollider } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { raycastSystem, RaycastQueryType, pointerEventsSystem } from '@dcl/sdk/ecs'

// Store block data with entities
type BlockData = {
  entity: Entity
  heights: string  // e.g., "3331" (4 corners: NW, NE, SW, SE)
  position: Vector3
}

// Array to store all blocks with their data
const blocks: BlockData[] = []

// Track the currently selected block
let selectedBlockIndex: number = -1

// Function to create a block using new 4-corner system
function createBlock(heights: string, position: Vector3): BlockData {
  // Validate input
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
  
  // Add MeshCollider component to make the block interactive
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS)
  
  // Make block interactive with hover text
  PointerEvents.create(entity, {
    pointerEvents: [
      {
        eventType: PointerEventType.PET_DOWN,
        eventInfo: { button: InputAction.IA_POINTER, hoverText: 'Select Block' }
      }
    ]
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

// Find block by entity ID
function findBlockByEntity(entity: Entity): number {
  return blocks.findIndex(block => block.entity === entity)
}

// ==== POINTER EVENTS SYSTEM ====

// Setup the pointer events system - better approach than custom raycasting for clicks
export function setupBlockInteraction(): void {
  // Register a callback for pointer down events
  pointerEventsSystem.onPointerDown(
    {
      entity: undefined, // Listen for all entities with PointerEvents
      opts: { button: InputAction.IA_POINTER }
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
        
        // Display sculpting options
        showSculptingOptions(blockIndex)
      }
    }
  )
  
  console.log('✅ Block interaction system initialized')
}

// ==== RAYCAST SYSTEM FROM CAMERA ====

// Setup a system to cast rays from the camera - useful for block identification without clicking
export function setupRaycastFromCamera(): void {
  // Create timer component for interval-based raycasting (better than continuous)
  const TimerComponent = engine.defineComponent('TimerComponent', { t: { type: 'number' } })
  
  // Add timer entity
  const timerEntity = engine.addEntity()
  TimerComponent.create(timerEntity, { t: 0 })
  
  // Add system that casts rays on an interval (more performant than continuous)
  const RAY_INTERVAL = 0.5 // Check every half second
  
  engine.addSystem((dt) => {
    for (const [entity] of engine.getEntitiesWith(TimerComponent)) {
      const timer = TimerComponent.getMutable(entity)
      timer.t += dt
      
      // Only cast ray on interval for better performance
      if (timer.t > RAY_INTERVAL) {
        timer.t = 0
        castRayFromCamera()
      }
    }
  })
  
  console.log('✅ Camera raycast system initialized')
}

// Function to cast ray from camera - will print what block the player is looking at
export function castRayFromCamera(): void {
  // Get camera entity
  const cameraEntity = engine.CameraEntity
  
  // Register raycast from camera in the direction it's facing
  raycastSystem.registerGlobalDirectionRaycast(
    {
      entity: cameraEntity,
      opts: {
        queryType: RaycastQueryType.RQT_HIT_FIRST,
        direction: Vector3.rotate(
          Vector3.Forward(),
          Transform.get(cameraEntity).rotation
        ),
        maxDistance: 16,
        collisionMask: ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS
      }
    },
    (raycastResult) => {
      // Check if ray hit anything
      if (raycastResult.hits.length > 0) {
        const hit = raycastResult.hits[0]
        const hitEntity = hit.entityId
        
        // Find block that was hit
        const blockIndex = findBlockByEntity(hitEntity)
        
        if (blockIndex !== -1) {
          const block = blocks[blockIndex]
          
          // Only log if different from last selected block to avoid spam
          if (blockIndex !== selectedBlockIndex) {
            console.log(`Looking at block ${blockIndex} (${block.heights})`)
            // Don't update selectedBlockIndex here - that's for actual clicks
          }
        }
      }
    }
  )
}

// ==== HELPER FUNCTIONS ====

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

// Helper function to modify corner heights
function modifyCornerHeight(heights: string, corner: number, newHeight: number): string {
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

// ===== KEYBOARD INPUT SYSTEM =====

// Set up keyboard controls for sculpting the selected block
export function setupSculptingControls(): void {
  // Create an input system that checks for key presses
  const keyMap: Record<string, boolean> = {}
  
  // Track which corner is selected (1-4)
  let selectedCorner = 1
  
  // A system that processes keyboard inputs
  engine.addSystem(() => {
    // Handle number keys 1-4 to select corners
    if (keyMap['KEY_1']) {
      selectedCorner = 1
      console.log(`Selected corner: 1 (NW)`)
      keyMap['KEY_1'] = false
    }
    else if (keyMap['KEY_2']) {
      selectedCorner = 2
      console.log(`Selected corner: 2 (NE)`)
      keyMap['KEY_2'] = false
    }
    else if (keyMap['KEY_3']) {
      selectedCorner = 3
      console.log(`Selected corner: 3 (SW)`)
      keyMap['KEY_3'] = false
    }
    else if (keyMap['KEY_4']) {
      selectedCorner = 4
      console.log(`Selected corner: 4 (SE)`)
      keyMap['KEY_4'] = false
    }
    
    // Q to lower the selected corner
    if (keyMap['KEY_Q']) {
      if (selectedBlockIndex !== -1) {
        console.log(`Lowering corner ${selectedCorner} of block ${selectedBlockIndex}`)
        sculptCornerDown(selectedBlockIndex, selectedCorner)
      } else {
        console.log('No block selected. Click a block first!')
      }
      keyMap['KEY_Q'] = false
    }
    
    // E to raise the selected corner
    if (keyMap['KEY_E']) {
      if (selectedBlockIndex !== -1) {
        console.log(`Raising corner ${selectedCorner} of block ${selectedBlockIndex}`)
        sculptCornerUp(selectedBlockIndex, selectedCorner)
      } else {
        console.log('No block selected. Click a block first!')
      }
      keyMap['KEY_E'] = false
    }
  })
  
  // Register keyboard event handlers
  engine.addSystem((dt, key) => {
    if (key === 'KEY_1' || key === 'KEY_2' || key === 'KEY_3' || key === 'KEY_4' || 
        key === 'KEY_Q' || key === 'KEY_E') {
      keyMap[key] = true
    }
  }, { eventType: 'KEY_DOWN' })
  
  console.log('✅ Sculpting controls initialized:')
  console.log('  - Click on a block to select it')
  console.log('  - Press 1-4 to select a corner')
  console.log('  - Press Q to lower the selected corner')
  console.log('  - Press E to raise the selected corner')
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
    
    // Setup interaction systems
    setupBlockInteraction()
    setupRaycastFromCamera()
    setupSculptingControls()
    
  } catch (error) {
    console.error('❌ Error setting up example blocks:', error)
  }
}

// Main initialization function
export function initAetheriaBlockSystem(): void {
  console.log('🌐 Initializing Aetheria Block System...')
  
  // Setup block interaction
  setupBlockInteraction()
  
  // Setup raycast system
  setupRaycastFromCamera()
  
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
  showSculptingOptions,
  setupExampleBlocks,
  selectedBlockIndex
}

// Uncomment to automatically initialize when this module is imported
// initAetheriaBlockSystem()