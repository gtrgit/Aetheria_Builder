import { 
  engine, 
  Transform, 
  GltfContainer, 
  Entity, 
  InputAction, 
  PointerEvents, 
  PointerEventType, 
  ColliderLayer, 
  MeshCollider 
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { pointerEventsSystem } from '@dcl/sdk/ecs'

// Reference to your existing blocks array and functions
import { blocks, findBlockByEntity } from './your-blocks-module'

// Track the currently selected block
let selectedBlockIndex: number = -1
let selectedCorner: number = 1

// Store which blocks already have pointer events registered
const registeredBlocks = new Set<Entity>()

// Setup the pointer events system - fixed implementation
export function setupBlockInteraction(): void {
  // Add a system to register pointer events for blocks
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
          
          // Display sculpting options - assuming this function is imported
          showSculptingOptions(index)
        }
      )
      
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
    })
  })
  
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

// Placeholder references to external functions - these should be imported from your blocks module
function sculptCornerUp(blockIndex: number, corner: number): boolean {
  // This should be imported from your main module
  console.log(`Would raise corner ${corner} of block ${blockIndex}`)
  return true
}

function sculptCornerDown(blockIndex: number, corner: number): boolean {
  // This should be imported from your main module
  console.log(`Would lower corner ${corner} of block ${blockIndex}`)
  return true
}

// Export the relevant functions
export {
  setupBlockInteraction,
  registerNewBlock,
  setupSculptingControls,
  selectedBlockIndex,
  selectedCorner
}