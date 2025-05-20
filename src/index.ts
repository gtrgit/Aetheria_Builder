import { engine, Transform, MeshRenderer, MeshCollider,GltfContainer, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

import {blocks,
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
} from './dcl_sdk7_block_system_corrected'

// import { createBlock,
//   updateBlockHeights,
//   updateBlockCorner,
//   removeBlock,
//   findBlockByEntity,
//   sculptCornerUp,
//   sculptCornerDown,
//   showBlocks,
//   showSculptingOptions,
//   validateBlock,
//   setupExampleBlocks } from './dcl_4corner_blocks'

// Create entity for the default cube
const defaultCube = engine.addEntity()


// Set the position to the center of the scene at x=8, y=1, z=8
Transform.create(defaultCube, {
  position: Vector3.create(8, .5, 8),
  scale: Vector3.create(1, 1, 1),
  rotation: Quaternion.fromEulerDegrees(0, 0, 0)
})

// Add the 3D model component with the path to the default cube GLB file
GltfContainer.create(defaultCube, {
      src: 'assets/blocks/aetheria_clean_3331_ry180.glb'
})

// 1 2 3
// 4 5 6  ← 5 is the center
// 7 8 9

// Example usage:
// Create initial blocks
// const block1 = createBlock('555555555', Vector3.create(8, 1, 8))   // Center
// const block2 = createBlock('555335135', Vector3.create(10, 1, 8))  // East

 const block1 = createBlock('3331', Vector3.create(1, 1, 1))   // Center
 const block2 = createBlock('1111', Vector3.create(3, 1, 1))   // Center
 const block3 = createBlock('1112', Vector3.create(5, 1, 1))   // Center

 setupExampleBlocks()
//  const block4 = createBlock('123122111', Vector3.create(7, 1, 1))   // Center
//  const block5 = createBlock('123123123', Vector3.create(9, 1, 1))   // Center
//  const block6 = createBlock('135013001', Vector3.create(11, 1, 1))   // Center
//  const block7 = createBlock('333111000', Vector3.create(13, 1, 1))   // Center
//  const block8 = createBlock('333111000', Vector3.create(15, 1, 1))   // Center

//  const block9 = createBlock('333223123', Vector3.create(1, 1, 3))   // Center
//  const block10 = createBlock('333233123', Vector3.create(3, 1, 3))   // Center
//  const block11 = createBlock('333233123', Vector3.create(5, 1, 3))   // Center
//  const block12 = createBlock('555555555', Vector3.create(7, 1, 3))   // Center
//  const block13 = createBlock('555555555', Vector3.create(9, 1, 3))   // Center

updateBlockCorner(0,3,1)
updateBlockCorner(0,1,2)
updateBlockCorner(1,4,2)
// removeBlock(1) //removing blocks will alter the index for subsequent blocks ids
// updateBlockCorner(2,4,3)
sculptCornerUp(2,4)
sculptCornerDown(2,4)
sculptCornerDown(2,4)
// showBlocks()
showSculptingOptions(0)