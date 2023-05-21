import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import * as CameraUtils from "three/examples/jsm/utils/CameraUtils"
import * as dat from "lil-gui"
import BufferShader from "./bufferShader"

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

/* 
Loader
*/
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load("./loadbg.jpg")
texture.encoding = THREE.sRGBEncoding
scene.background = texture

// const buffer = new THREE.WebGLRenderTarget(1000, 1000)
// buffer.texture.encoding = THREE.sRGBEncoding

/* 
bufferCamera
*/
const bufferCamera = new THREE.PerspectiveCamera(75, 1.0, 0.01, 100)
bufferCamera.position.set(0.25, -0.25, 2)



/* 
border
*/

const TBGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1)
const LRGeo = new THREE.BoxGeometry(0.1, 2, 0.1)

const borderMaterial = new THREE.MeshToonMaterial({ color: "gray" })

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

// const bufferScene = new THREE.Scene()

// bufferScene.add(bufferCamera)
// bufferScene.background = new THREE.Color("pink")

// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(0.3, 0.3, 0.3),
//     new THREE.MeshPhongMaterial({ color: "red" })
// )
// cube.rotation.y += Math.PI / 6

// bufferScene.add(cube)

/* 

bufferSceneLight
*/
// const bufferambientLight = new THREE.AmbientLight("black")
// bufferScene.add(bufferambientLight)

// const bufferDirlight = new THREE.DirectionalLight("white", 0.6)
// bufferDirlight.position.set(0, 5, 5)
// bufferScene.add(bufferDirlight)

/* 

Light
*/
const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

const directionalLgiht = new THREE.DirectionalLight("white", 0.7)
directionalLgiht.position.set(0, 5, 5)
scene.add(directionalLgiht)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener("resize", () => {
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
const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    1000
)
camera.position.set(0.25, -0.25, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
// controls.enabled = false
controls.enableDamping = true
/* emit Y */
controls.maxAzimuthAngle = Math.PI / 8
controls.minAzimuthAngle = -Math.PI / 8

/* emit X */


controls.maxPolarAngle = (Math.PI * 2) / 3
controls.minPolarAngle = Math.PI / 3

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
// renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/* 
bufferShader
*/

let bottomLeftCorner = new THREE.Vector3(),
    bottomRightCorner = new THREE.Vector3(),
    topLeftCorner = new THREE.Vector3()

/* 
x,y鼠标位置
z:鼠标是否按下
w click
*/
const iMouse = new THREE.Vector4()

/* 
x.y => canvas的宽和高
z =>  渲染器的像素比
*/
const { width, height } = renderer.getSize(new THREE.Vector2())
const iResolution = new THREE.Vector3(width, height, renderer.pixelRatio)

const common = `
            
#define dt 0.15
#define USE_VORTICITY_CONFINEMENT
//#define MOUSE_ONLY

//Recommended values between 0.03 and 0.2
//higher values simulate lower viscosity fluids (think billowing smoke)
#define VORTICITY_AMOUNT 0.11

float mag2(vec2 p){return dot(p,p);}
vec2 point1(float t) {
    t *= 0.62;
    return vec2(0.12,0.5 + sin(t)*0.2);
}
vec2 point2(float t) {
    t *= 0.62;
    return vec2(0.88,0.5 + cos(t + 1.5708)*0.2);
}

vec4 solveFluid(sampler2D smp, vec2 uv, vec2 w, float time, vec3 mouse, vec3 lastMouse)
{
    const float K = 0.2;
    const float v = 0.55;
    
    vec4 data = texture2D(smp, uv, 0.0);
    vec4 tr = texture2D(smp, uv + vec2(w.x , 0), 0.0);
    vec4 tl = texture2D(smp, uv - vec2(w.x , 0), 0.0);
    vec4 tu = texture2D(smp, uv + vec2(0 , w.y), 0.0);
    vec4 td = texture2D(smp, uv - vec2(0 , w.y), 0.0);
    
    vec3 dx = (tr.xyz - tl.xyz)*0.5;
    vec3 dy = (tu.xyz - td.xyz)*0.5;
    vec2 densDif = vec2(dx.z ,dy.z);
    
    data.z -= dt*dot(vec3(densDif, dx.x + dy.y) ,data.xyz); //density
    vec2 laplacian = tu.xy + td.xy + tr.xy + tl.xy - 4.0*data.xy;
    vec2 viscForce = vec2(v)*laplacian;
    data.xyw = texture2D(smp, uv - dt*data.xy*w, 0.).xyw; //advection
    
    vec2 newForce = vec2(0);
    #ifndef MOUSE_ONLY
    #if 1
    newForce.xy += 0.75*vec2(.0003, 0.00015)/(mag2(uv-point1(time))+0.0001);
    newForce.xy -= 0.75*vec2(.0003, 0.00015)/(mag2(uv-point2(time))+0.0001);
    #else
    newForce.xy += 0.9*vec2(.0003, 0.00015)/(mag2(uv-point1(time))+0.0002);
    newForce.xy -= 0.9*vec2(.0003, 0.00015)/(mag2(uv-point2(time))+0.0002);
    #endif
    #endif
    
    if (mouse.z > 1. && lastMouse.z > 1.)
    {
        vec2 vv = clamp(vec2(mouse.xy*w - lastMouse.xy*w)*400., -6., 6.);
        newForce.xy += .001/(mag2(uv - mouse.xy*w)+0.001)*vv;
    }
    
    data.xy += dt*(viscForce.xy - K/dt*densDif + newForce); //update velocity
    data.xy = max(vec2(0), abs(data.xy)-1e-4)*sign(data.xy); //linear velocity decay
    
    #ifdef USE_VORTICITY_CONFINEMENT
    data.w = (tr.y - tl.y - tu.x + td.x);
    vec2 vort = vec2(abs(tu.w) - abs(td.w), abs(tl.w) - abs(tr.w));
    vort *= VORTICITY_AMOUNT/length(vort + 1e-9)*data.w;
    data.xy += vort;
    #endif
    
    data.y *= smoothstep(.5,.48,abs(uv.y-0.5)); //Boundaries
    
    data = clamp(data, vec4(vec2(-10), 0.5 , -10.), vec4(vec2(10), 3.0 , 10.));
    
    return data;
}
`

const buffAFragment = `
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float iFrame;
uniform sampler2D iChannel0;

${common}
//Chimera's Breath
//by nimitz 2018 (twitter: @stormoid)

//see "Common" tab for fluid simulation code

float length2(vec2 p){return dot(p,p);}
mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}

void main()
{
    vec2 uv = gl_FragCoord.xy/iResolution.xy;
    vec2 w = 1.0/iResolution.xy;
    
    vec4 lastMouse = texelFetch(iChannel0, ivec2(0,0), 0);
    vec4 data = solveFluid(iChannel0, uv, w, iTime, iMouse.xyz, lastMouse.xyz);
    
    if (iFrame < 20.)
    {
        data = vec4(0.5,0,0,0);
    }
    
    if (gl_FragCoord.y < 1.)
        data = iMouse;
    
    gl_FragColor = data;
    
}
`

const bufferA = new BufferShader(
    buffAFragment,
    iResolution.x,
    iResolution.y,
    {
        iTime: { value: 0 },
        iFrame: { value: 0 },
        iMouse: { value: iMouse },
        iResolution: { value: iResolution },
        iChannel0: { value: null },
    },
    renderer,
    bufferCamera

)

const bufferB = new BufferShader(
    buffAFragment,
    iResolution.x,
    iResolution.y,
    {
        iTime: { value: 0 },
        iFrame: { value: 0 },
        iMouse: { value: iMouse },
        iResolution: { value: iResolution },
        iChannel0: { value: null },
    },
    renderer,
    bufferCamera

)

const bufferC = new BufferShader(
    buffAFragment,
    iResolution.x,
    iResolution.y,
    {
        iTime: { value: 0 },
        iFrame: { value: 0 },
        iMouse: { value: iMouse },
        iResolution: { value: iResolution },
        iChannel0: { value: null },
    },
    renderer,
    bufferCamera

)

const bufferDFragment = `
uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float iFrame;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
${common}
//Chimera's Breath
//by nimitz 2018 (twitter: @stormoid)

//see "Common" tab for fluid simulation code

mat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}

//shader incoming relating to this palette
vec3 getPalette(float x, vec3 c1, vec3 c2, vec3 p1, vec3 p2)
{
    float x2 = fract(x/2.0);
    x = fract(x);   
    mat3 m = mat3(c1, p1, c2);
    mat3 m2 = mat3(c2, p2, c1);
    float omx = 1.0-x;
    vec3 pws = vec3(omx*omx, 2.0*omx*x, x*x);
    return clamp(mix(m*pws, m2*pws, step(x2,0.5)),0.,1.);
}

vec4 pal(float x)
{
    vec3 pal = getPalette(-x, vec3(0.2, 0.5, .7), vec3(.9, 0.4, 0.1), vec3(1., 1.2, .5), vec3(1., -0.4, -.0));
    return vec4(pal, 1.);
}

vec4 pal2(float x)
{
    vec3 pal = getPalette(-x, vec3(0.4, 0.3, .5), vec3(.9, 0.75, 0.4), vec3(.1, .8, 1.3), vec3(1.25, -0.1, .1));
    return vec4(pal, 1.);
}

void main()
{
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 mo = iMouse.xy / iResolution.xy;
    vec2 w = 1.0/iResolution.xy;
    
    vec2 velo = textureLod(iChannel0, uv, 0.).xy;
    vec4 col = textureLod(iChannel1, uv - dt*velo*w*3., 0.); //advection
    if (gl_FragCoord.y < 1. && gl_FragCoord.x < 1.)
        col = vec4(0);
    vec4 lastMouse = texelFetch(iChannel1, ivec2(0,0), 0).xyzw;
    
    if (iMouse.z > 1. && lastMouse.z > 1.)
    {
        float str = smoothstep(-.5,1.,length(mo - lastMouse.xy/iResolution.xy));   
        col += str*0.0009/(pow(length(uv - mo),1.7)+0.002)*pal2(-iTime*0.7);
    }
    
    #ifndef MOUSE_ONLY
    col += .0025/(0.0005+pow(length(uv - point1(iTime)),1.75))*dt*0.12*pal(iTime*0.05 - .0);
    col += .0025/(0.0005+pow(length(uv - point2(iTime)),1.75))*dt*0.12*pal2(iTime*0.05 + 0.675);
    #endif
    
    
    if (iFrame < 20.)
    {
        col = vec4(0.);
    }
    
    col = clamp(col, 0.,5.);
    col = max(col - (0.0001 + col*0.004)*.5, 0.); //decay
    
    if (gl_FragCoord.y < 1. && gl_FragCoord.x < 1.)
        col = iMouse;

    gl_FragColor = col;
    
}

`

const bufferD = new BufferShader(
    bufferDFragment,
    iResolution.x,
    iResolution.y,
    {
        iTime: { value: 0 },
        iFrame: { value: 0 },
        iMouse: { value: iMouse },
        iResolution: { value: iResolution },
        iChannel0: { value: null },
        iChannel1: { value: null },
    },
    renderer,
    bufferCamera
)

const mainBuffer = new BufferShader(
    `
    uniform vec3 iResolution;
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
 
    void main()
{
    vec4 col = textureLod(iChannel0, gl_FragCoord.xy/iResolution.xy, 0.);
    if (gl_FragCoord.y < 1. || gl_FragCoord.y >= (iResolution.y-1.))
        col = vec4(0);
    gl_FragColor = col;
}
    `,
    iResolution.x,
    iResolution.y,
    {
        iTime: { value: 0 },
        iFrame: { value: 0 },
        iMouse: { value: iMouse },
        iResolution: { value: iResolution },
        iChannel0: { value: null },
    },
    renderer,
    bufferCamera
)

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(2, 2, 32, 32)

// Material
const material = new THREE.MeshPhongMaterial({
    // map: buffer.texture
    map: mainBuffer.readBuffer.texture,
    emissiveMap: mainBuffer.readBuffer.texture,
    emissive:'red',
    emissiveIntensity:2
    
})

// Mesh
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

/* 
Event
*/
// const handleMouseMove = (e) => {
//     console.log(e.pageX,e.pageY);
//     iMouse.x = e.clientX
//     iMouse.y = innerHeight - e.pageY
// }
// document.addEventListener('mousemove', handleMouseMove)
// document.addEventListener('mousedown', () => {
//     iMouse.z = 2
//     document.addEventListener('mouseup', () => {
//         document.removeEventListener('mousemove', handleMouseMove)
//         iMouse.z = 0
//     })
// })


/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () => {
    // Update controls
    controls.update()

    const delta = clock.getDelta()

    

    // cube.rotation.y += 0.01

    scene.worldToLocal(bufferCamera.position.copy(camera.position))
    bufferCamera.lookAt(controls.target)
    scene.localToWorld(bottomLeftCorner.set(-1, -1, 0))
    scene.localToWorld(bottomRightCorner.set(1, - 1, 0))
    scene.localToWorld(topLeftCorner.set(-1, 1, 0))
    // set the projection matrix to encompass the portal's frame
    CameraUtils.frameCorners(bufferCamera, bottomLeftCorner, bottomRightCorner, topLeftCorner, false)



    bufferA.uniform["iChannel0"].value = bufferC.readBuffer.texture
    bufferA.uniform["iFrame"].value++
    bufferA.uniform["iTime"].value += delta
    bufferA.render()

    bufferB.uniform["iChannel0"].value = bufferA.readBuffer.texture
    bufferB.uniform["iFrame"].value++
    bufferB.uniform["iTime"].value += delta
    bufferB.render()

    bufferC.uniform["iChannel0"].value = bufferB.readBuffer.texture
    bufferC.uniform["iFrame"].value++
    bufferC.uniform["iTime"].value += delta
    bufferC.render()

    bufferD.uniform["iChannel0"].value = bufferA.readBuffer.texture
    bufferD.uniform["iChannel1"].value = bufferD.readBuffer.texture
    bufferD.uniform["iFrame"].value++
    bufferD.uniform["iTime"].value += delta
    bufferD.render()

    mainBuffer.uniform["iChannel0"].value = bufferD.readBuffer.texture
    mainBuffer.render()


    
    renderer.render(scene, camera)

    // Render
    // renderer.setRenderTarget(buffer)
    // renderer.render(bufferScene, bufferCamera)
    // renderer.setRenderTarget(null)


    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
