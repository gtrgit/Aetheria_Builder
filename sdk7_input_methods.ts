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
  InputState
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { inputSystem } from '@dcl/sdk/ecs'

// Global variables to track state
let selectedBlockIndex: number = -1
let selectedCorner: number = 1

// Setup controls for sculpting using SDK7's inputSystem
export function setupSculptingControls(): void {
  // Create an entity that will listen for input events
  const inputEntity = engine.addEntity()
  
  // Add PointerEvents component for global inputs
  PointerEvents.create(inputEntity, {
    pointerEvents: [
      // Listen for number keys (1-4)
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_ACTION_3 } }, // 1 key
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_ACTION_4 } }, // 2 key
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_ACTION_5 } }, // 3 key
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_ACTION_6 } }, // 4 key
      
      // Listen for action keys (E and F)
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_PRIMARY } },   // E key
      { eventType: PointerEventType.PET_DOWN, eventInfo: { button: InputAction.IA_SECONDARY } }  // F key
    ]
  })
  
  // Add a system that uses inputSystem to check for input actions
  engine.addSystem(() => {
    // Check for number keys (1-4) to select corners
    let action3 = inputSystem.getInputCommand(InputAction.IA_ACTION_3, PointerEventType.PET_DOWN)
    if (action3) {
      selectedCorner = 1
      console.log(`Selected corner: 1 (NW)`)
    }
    
    let action4 = inputSystem.getInputCommand(InputAction.IA_ACTION_4, PointerEventType.PET_DOWN)
    if (action4) {
      selectedCorner = 2
      console.log(`Selected corner: 2 (NE)`)
    }
    
    let action5 = inputSystem.getInputCommand(InputAction.IA_ACTION_5, PointerEventType.PET_DOWN)
    if (action5) {
      selectedCorner = 3
      console.log(`Selected corner: 3 (SW)`)
    }
    
    let action6 = inputSystem.getInputCommand(InputAction.IA_ACTION_6, PointerEventType.PET_DOWN)
    if (action6) {
      selectedCorner = 4
      console.log(`Selected corner: 4 (SE)`)
    }
    
    // Check for action keys (E and F) to modify corners
    let primaryAction = inputSystem.getInputCommand(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)
    if (primaryAction && selectedBlockIndex !== -1) {
      console.log(`Raising corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerUp(selectedBlockIndex, selectedCorner)
    }
    
    let secondaryAction = inputSystem.getInputCommand(InputAction.IA_SECONDARY, PointerEventType.PET_DOWN)
    if (secondaryAction && selectedBlockIndex !== -1) {
      console.log(`Lowering corner ${selectedCorner} of block ${selectedBlockIndex}`)
      sculptCornerDown(selectedBlockIndex, selectedCorner)
    }
  })
  
  console.log('✅ Sculpting controls initialized:')
  console.log('  - Click on a block to select it')
  console.log('  - Press 1-4 keys to select a corner')
  console.log('  - Press E to raise the selected corner')
  console.log('  - Press F to lower the selected corner')
}

// Alternative implementation using pointerEventsSystem for global actions
export function setupSculptingControlsAlternative(): void {
  // Register handlers for each of the 1-4 keys
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_ACTION_3 },
    () => {
      selectedCorner = 1
      console.log(`Selected corner: 1 (NW)`)
    }
  )
  
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_ACTION_4 },
    () => {
      selectedCorner = 2
      console.log(`Selected corner: 2 (NE)`)
    }
  )
  
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_ACTION_5 },
    () => {
      selectedCorner = 3
      console.log(`Selected corner: 3 (SW)`)
    }
  )
  
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_ACTION_6 },
    () => {
      selectedCorner = 4
      console.log(`Selected corner: 4 (SE)`)
    }
  )
  
  // Register handlers for E and F keys
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_PRIMARY },
    () => {
      if (selectedBlockIndex !== -1) {
        console.log(`Raising corner ${selectedCorner} of block ${selectedBlockIndex}`)
        sculptCornerUp(selectedBlockIndex, selectedCorner)
      } else {
        console.log('No block selected. Click a block first!')
      }
    }
  )
  
  pointerEventsSystem.onGlobalPointerDown(
    { button: InputAction.IA_SECONDARY },
    () => {
      if (selectedBlockIndex !== -1) {
        console.log(`Lowering corner ${selectedCorner} of block ${selectedBlockIndex}`)
        sculptCornerDown(selectedBlockIndex, selectedCorner)
      } else {
        console.log('No block selected. Click a block first!')
      }
    }
  )
  
  console.log('✅ Sculpting controls initialized (alternative method):')
  console.log('  - Click on a block to select it')
  console.log('  - Press 1-4 keys to select a corner')
  console.log('  - Press E to raise the selected corner')
  console.log('  - Press F to lower the selected corner')
}

// External functions (assumed to be imported in the actual implementation)
function sculptCornerUp(blockIndex: number, corner: number): boolean {
  // This would be the actual implementation or imported
  console.log(`Raising corner ${corner} of block ${blockIndex}`)
  return true
}

function sculptCornerDown(blockIndex: number, corner: number): boolean {
  // This would be the actual implementation or imported
  console.log(`Lowering corner ${corner} of block ${blockIndex}`)
  return true
}