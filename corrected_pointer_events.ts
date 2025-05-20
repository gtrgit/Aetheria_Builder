// Setup the pointer events system - corrected implementation
export function setupBlockInteraction(): void {
  // We need to register each block individually for pointer events
  // since the event doesn't tell us which entity was clicked

  // First, add a system that handles updating newly created blocks
  engine.addSystem(() => {
    // For each block, ensure it has pointer events registered
    blocks.forEach((block, index) => {
      // Skip if we already processed this block
      if (block.entity.hasOwnProperty('__pointerEventsRegistered')) {
        return;
      }

      // Register pointer events for this block
      pointerEventsSystem.onPointerDown(
        {
          entity: block.entity,
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

      // Mark as processed to avoid registering events multiple times
      (block.entity as any).__pointerEventsRegistered = true;
    });
  });
  
  console.log('✅ Block interaction system initialized')
}

// Modified createBlock function to ensure it adds PointerEvents component
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