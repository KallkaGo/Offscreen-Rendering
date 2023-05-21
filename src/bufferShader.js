import * as THREE from 'three'
import * as CameraUtils from "three/examples/jsm/utils/CameraUtils"
export default class bufferShader {
  scene = new THREE.Scene()
 
  constructor(fragment, width, height, uniform, renderer, camera) {
    this.camera = camera
    this.renderer = renderer
    this.fragment = fragment
    this.uniform = uniform
    this.readBuffer = new THREE.WebGLRenderTarget(width, height, {
      format:THREE.RGBAFormat,
      type: THREE.FloatType
    })
    this.writeBuffer = this.readBuffer.clone()

    this.createMesh()
  }

  createMesh () {
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(innerWidth, innerHeight),
      new THREE.ShaderMaterial({
        fragmentShader: this.fragment,
        vertexShader: `
      void main(){
        vec4 modelPosition = modelMatrix * vec4(position,1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectPosition = projectionMatrix * viewPosition;
        gl_Position = vec4(position,1.0);
      }
      `,
        uniforms: this.uniform
      })

    ))

  }
  swapBuffers () {
    const tmp = this.readBuffer
    this.readBuffer = this.writeBuffer
    this.writeBuffer = tmp

  }
  render () {
    this.renderer.setRenderTarget(this.writeBuffer)
    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
    this.swapBuffers()
  }
}