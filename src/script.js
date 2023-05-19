import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils'
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


/* 
Loader
*/
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('./loadbg.jpg')
texture.encoding = THREE.sRGBEncoding
scene.background =texture




const buffer = new THREE.WebGLRenderTarget(1000, 1000)
buffer.texture.encoding = THREE.sRGBEncoding

/* 
bufferCamera
*/
const bufferCamera = new THREE.PerspectiveCamera(75, 1.0, 0.01, 100)
bufferCamera.position.set(0.25, - 0.25, 2)


/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2, 2, 32, 32)

// Material
const material = new THREE.MeshBasicMaterial({
    map: buffer.texture
})


/* 
border
*/

const TBGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1)
const LRGeo = new THREE.BoxGeometry(0.1, 2, 0.1)

const borderMaterial = new THREE.MeshToonMaterial({ color: 'gray' })

const group = new THREE.Group()

const leftBorder = new THREE.Mesh(LRGeo, borderMaterial)
leftBorder.position.set(-1.05, 0, 0.05)

const rightBorder = new THREE.Mesh(LRGeo, borderMaterial)
rightBorder.position.set(1.05, 0, 0.05)

const topBorder = new THREE.Mesh(TBGeo, borderMaterial)
topBorder.position.set(0, 1.05, 0.05)

const bottomBorder = new THREE.Mesh(TBGeo, borderMaterial)
bottomBorder.position.set(0, -1.05, 0.05)

group.add(leftBorder, rightBorder, topBorder, bottomBorder)

scene.add(group)


const bufferScene = new THREE.Scene()

bufferScene.add(bufferCamera)
bufferScene.background = new THREE.Color('pink')

const cube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshPhongMaterial(
    { color: 'red' })
)
cube.rotation.y += Math.PI / 6

bufferScene.add(cube)

/* 

bufferSceneLight
*/
const bufferambientLight = new THREE.AmbientLight('black')
bufferScene.add(bufferambientLight)

const bufferDirlight = new THREE.DirectionalLight('white', 0.6)
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

const directionalLgiht = new THREE.DirectionalLight('white', 0.7)
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(0.25, - 0.25, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
let bottomLeftCorner = new THREE.Vector3()
    , bottomRightCorner = new THREE.Vector3()
    , topLeftCorner = new THREE.Vector3()

const tick = () => {
    // Update controls
    controls.update()

    // cube.rotation.y += 0.01

    bufferScene.worldToLocal(bufferCamera.position.copy(camera.position))
    bufferCamera.lookAt(controls.target)
    bufferScene.localToWorld(bottomLeftCorner.set(-1, -1, 0))
    bufferScene.localToWorld(bottomRightCorner.set(1, - 1, 0))
    bufferScene.localToWorld(topLeftCorner.set(-1, 1, 0))
    // set the projection matrix to encompass the portal's frame
    CameraUtils.frameCorners(bufferCamera, bottomLeftCorner, bottomRightCorner, topLeftCorner, false)


    // Render
    renderer.setRenderTarget(buffer)
    renderer.render(bufferScene, bufferCamera)
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()