import { 
  engine, 
  Transform, 
  GltfContainer, 
  Entity, 
  InputAction, 
  PointerEvents, 
  PointerEventType, 
  ColliderLayer, 
  MeshCollider,
  PointerEventsResult,
  // InputState
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { raycastSystem, RaycastQueryType, pointerEventsSystem, inputSystem } from '@dcl/sdk/ecs'

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
// Track which corner is selected (1-4)
let selectedCorner = 1

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


// Store which blocks already have pointer events registered
const registeredBlocks = new Set<Entity>()

// ==== POINTER EVENTS SYSTEM ====

// Setup the pointer events system - corrected implementation
export function setupBlockInteraction(): void {
  // We need to register each block individually for pointer events
  // since the event doesn't tell us which entity was clicked

  // First, add a system that handles updating newly created blocks
  engine.addSystem(() => {
    // For each block, ensure it has pointer events registered
    blocks.forEach((block, index) => {

      const entity = block.entity
      
      // Skip if we already processed this entity
      if (registeredBlocks.has(entity)) {
        return
      }

      // Register pointer events for this block
      pointerEventsSystem.onPointerDown(
        {
          entity: entity,
          opts: { 
            button: InputAction.IA_POINTER,
            hoverText: `Select Block ${index}`
          }
        },
        () => {
          // Update selected block
          selectedBlockIndex = index
          
          // Print block info to console
          console.log('\n🔍 Block Selected:')
          console.log(`  Index: ${index}`)
          console.log(`  Heights: ${block.heights}`)
          console.log(`  Position: (${block.position.x}, ${block.position.y}, ${block.position.z})`)
          
          // Display sculpting options
          showSculptingOptions(index)
        }
      );
  
      // Add PointerEvents component if not already present
      if (!PointerEvents.has(entity)) {
        PointerEvents.create(entity, {
          pointerEvents: [
            {
              eventType: PointerEventType.PET_DOWN,
              eventInfo: { button: InputAction.IA_POINTER, hoverText: 'Select Block' }
            }
          ]
        })
      }
      
      // Add to our set of processed entities
      registeredBlocks.add(entity)
    });
  });
  
  console.log('✅ Block interaction system initialized')
}


// Function to ensure new blocks are properly set up with colliders and pointer events
export function registerNewBlock(blockData: { entity: Entity, heights: string, position: Vector3 }): void {
  const entity = blockData.entity
  
  // Add MeshCollider component to make the block interactive
  if (!MeshCollider.has(entity)) {
    MeshCollider.setBox(entity, ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS)
  }
  
  // Make block interactive with hover text
  if (!PointerEvents.has(entity)) {
    PointerEvents.create(entity, {
      pointerEvents: [
        {
          eventType: PointerEventType.PET_DOWN,
          eventInfo: { button: InputAction.IA_POINTER, hoverText: 'Select Block' }
        }
      ]
    })
  }
  
  // The system will automatically register pointer events for this block on next tick
}





// ==== RAYCAST SYSTEM FROM CAMERA ====
// Global variable to track which block we're looking at
let hoveredBlockIndex: number = -1

// Setup a simpler raycast system with a local timer
export function setupSimpleRaycastSystem(): void {
  // Local timer variable - no need for a component
  let timer = 0
  
  // Add system that casts rays on an interval
  const RAY_INTERVAL = 0.5 // Check every half second
  
  engine.addSystem((dt) => {
    // Update timer
    timer += dt
    
    // Only cast ray on interval for better performance
    if (timer >= RAY_INTERVAL) {
      timer = 0 // Reset timer
      
      // Cast ray from camera
      castRayFromCamera()
    }
  })
  
  console.log('✅ Simple raycast system initialized')
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
        const hitEntityId = hit.entityId

        let hitEntity:Entity | null = null;
        

        for (const [entity] of engine.getEntitiesWith(Transform)) {
          if (entity === hitEntityId) {
            hitEntity = entity;
            break; // Stop once we find it
          }
        }
              
        if (hitEntity) {
          // Find which block was hit
          const blockIndex = findBlockByEntity(hitEntity)
          // ...rest of logic
        }
            
            
        }


      }
    
  )
}


// Utility system for any kind of time-based event
export function createIntervalSystem(intervalInSeconds: number, callback: () => void): void {
  let timer = 0
  
  engine.addSystem((dt) => {
    timer += dt
    
    if (timer >= intervalInSeconds) {
      timer = 0
      callback()
    }
  })
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
  
  console.log('\n💡 Controls:')
  console.log(`  ACTION_3 (1 key): Select corner 1 (NW)`)
  console.log(`  ACTION_4 (2 key): Select corner 2 (NE)`)
  console.log(`  ACTION_5 (3 key): Select corner 3 (SW)`)
  console.log(`  ACTION_6 (4 key): Select corner 4 (SE)`)
  console.log(`  PRIMARY (E key): Raise selected corner`)
  console.log(`  SECONDARY (F key): Lower selected corner`)
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

// // Global variables to track state
// let selectedBlockIndex: number = -1
// let selectedCorner: number = 1

// Setup the input system for keyboard controls
export function setupSculptingControls(): void {
  // Set up a system that uses inputSystem to check for input actions
  engine.addSystem(() => {
    // Check for number keys (1-4) to select corners
    let cmd1 = inputSystem.getInputCommand(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN)
    if (cmd1) {
      selectedCorner = 1
      console.log(`Selected corner: 1 (NW)`)
    }
    
    let cmd2 = inputSystem.getInputCommand(InputAction.IA_ACTION_4, PointerEventType.PET_DOWN)
    if (cmd2) {
      selectedCorner = 2
      console.log(`Selected corner: 2 (NE)`)
    }
    
    let cmd3 = inputSystem.getInputCommand(InputAction.IA_ACTION_5, PointerEventType.PET_DOWN)
    if (cmd3) {
      selectedCorner = 3
      console.log(`Selected corner: 3 (SW)`)
    }
    
    let cmd4 = inputSystem.getInputCommand(InputAction.IA_ACTION_6, PointerEventType.PET_DOWN)
    if (cmd4) {
      selectedCorner = 4
      console.log(`Selected corner: 4 (SE)`)
    }
    
    // Check for E key (primary) to raise the selected corner
    let cmdE = inputSystem.getInputCommand(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)
    if (cmdE && selectedBlockIndex !== -1) {
      console.log(`Raising corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerUp(selectedBlockIndex, selectedCorner)
    }
    
    // Check for F key (secondary) to lower the selected corner
    let cmdF = inputSystem.getInputCommand(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)
    if (cmdF && selectedBlockIndex !== -1) {
      console.log(`Lowering corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerDown(selectedBlockIndex, selectedCorner)
    }
  })
  
  console.log('✅ Sculpting controls initialized')
}


// // Placeholder functions for completion
// function sculptCornerUp(blockIndex: number, corner: number): boolean {
//   console.log(`Raising corner ${corner} of block ${blockIndex}`)
//   return true;
// }

// function sculptCornerDown(blockIndex: number, corner: number): boolean {
//   console.log(`Lowering corner ${corner} of block ${blockIndex}`)
//   return true;
// }


// Example setup function
function setupExampleBlocks(): void {
  console.log('🎮 Setting up example blocks...')
  
  // Create some example blocks using the new 4-corner system
  try {
    const block1 = createBlock('3333', Vector3.create(1, 1, 1))    // Full cube
    const block2 = createBlock('3331', Vector3.create(2, 1, 1))    // SE corner lower
    const block3 = createBlock('3113', Vector3.create(3, 1, 1))    // NE and SW corners lower
    const block4 = createBlock('1323', Vector3.create(4, 1, 1))    // Mixed heights
    
    console.log('\n✅ Example blocks created successfully!')
    
    // Setup interaction systems
    setupBlockInteraction()
    // setupRaycastFromCamera()
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
  // setupRaycastFromCamera()
  
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
  selectedBlockIndex,
  selectedCorner
}

// Uncomment to automatically initialize when this module is imported
// initAetheriaBlockSystem()