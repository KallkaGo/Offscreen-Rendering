import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'


/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

scene.background = new THREE.Color('ivory')


const buffer = new THREE.WebGLRenderTarget(1000, 1000)


/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2, 2, 32, 32)

// Material
const material = new THREE.MeshToonMaterial({
    map: buffer.texture
})



const bufferScene = new THREE.Scene()

const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial(
    { color: 'red' })
)

bufferScene.add(cube)

/* 

bufferSceneLight
*/
const bufferambientLight = new THREE.AmbientLight('black')
bufferScene.add(bufferambientLight)

const bufferDirlight = new THREE.DirectionalLight()
bufferDirlight.position.set(0, 5, 5)
bufferScene.add(bufferDirlight)


// Mesh
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

/* 

Light
*/
const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

const directionalLgiht = new THREE.DirectionalLight()
directionalLgiht.position.set(0, 5, 5)
scene.add(directionalLgiht)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0.25, - 0.25, 1)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const tick = () => {
    // Update controls
    controls.update()

    cube.rotation.y += 0.001

    // Render
    renderer.setRenderTarget(buffer)
    renderer.render(bufferScene, camera)
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()