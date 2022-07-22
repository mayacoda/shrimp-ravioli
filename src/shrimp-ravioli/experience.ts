import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { calculateCanvasSize } from '../utils/calculate-canvas-size'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { getDebugUi } from '../utils/debug-ui'

const gui = getDebugUi()

/**
 * Creates an example scene with a bouncing character.
 */
export const runExperience = () => {
  // Canvas
  const canvas = document.querySelector<HTMLDivElement>('#canvas')!
  const canvasAspectRatio = window.innerWidth / window.innerHeight
  let size = calculateCanvasSize(canvasAspectRatio)

  // Scene
  const scene = new THREE.Scene()

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(size.width, size.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.physicallyCorrectLights = true
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.enabled = true

  // Camera
  const camera = new THREE.PerspectiveCamera(30, size.width / size.height, 0.2, 1000)
  camera.position.y = 0.8
  camera.position.z = 0.7
  scene.add(camera)

  // Lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(0.452, 4.14, -1.515)
  directionalLight.castShadow = true
  directionalLight.shadow.camera.near = 0.01
  directionalLight.shadow.camera.far = 6
  directionalLight.shadow.bias = -0.01
  directionalLight.shadow.mapSize.width = 4096
  directionalLight.shadow.mapSize.height = 4096
  scene.add(directionalLight)

  gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity')
  gui.add(directionalLight.position, 'x').min(-5).max(5).step(0.001).name('lightX')
  gui.add(directionalLight.position, 'y').min(-5).max(5).step(0.001).name('lightY')
  gui.add(directionalLight.position, 'z').min(-5).max(5).step(0.001).name('lightZ')

  // Scene elements
  const loadingManger = new THREE.LoadingManager()
  const textureLoader = new THREE.TextureLoader(loadingManger)
  const dracoLoader = new DRACOLoader(loadingManger)
  const gltfLoader = new GLTFLoader(loadingManger)

  dracoLoader.setDecoderPath('/draco/')
  dracoLoader.preload()

  gltfLoader.setDRACOLoader(dracoLoader)

  // Plate
  gltfLoader.load('/shrimp-ravioli/shrimp-ravioli.glb', (gltf) => {
    gltf.scene.scale.setScalar(0.05)
    scene.add(gltf.scene)
    updateMaterials()
  })

  // Table
  let plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10),
    new THREE.MeshStandardMaterial()
  )
  plane.rotation.x = -Math.PI / 2
  scene.add(plane)
  plane.receiveShadow = true

  const tileMap = textureLoader.load('/shrimp-ravioli/tile-map.png')
  tileMap.repeat.x = 6
  tileMap.repeat.y = 12
  tileMap.wrapS = THREE.RepeatWrapping
  tileMap.wrapT = THREE.RepeatWrapping

  plane.material.map = tileMap

  // Environmental maps
  const cubeTextureLoader = new THREE.CubeTextureLoader()
  const environmentMap = cubeTextureLoader.load([
    '/environmentMaps/0/px.jpg',
    '/environmentMaps/0/nx.jpg',
    '/environmentMaps/0/py.jpg',
    '/environmentMaps/0/ny.jpg',
    '/environmentMaps/0/pz.jpg',
    '/environmentMaps/0/nz.jpg'
  ])

  environmentMap.encoding = THREE.sRGBEncoding

  scene.background = environmentMap
  scene.environment = environmentMap
  const texture = textureLoader.load('/shrimp-ravioli/shrimp-ravioli-color-map-final.png')

  const customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: texture,
    alphaTest: 0.5
  })

  function updateMaterials() {
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return

      child.castShadow = true
      child.receiveShadow = true

      if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMapIntensity = 3
      }

      if (child.name.includes('arugola') || child.name.includes('branch')) {
        child.customDepthMaterial = customDepthMaterial
      }
    })
  }

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.enableZoom = true
  controls.enableDamping = true

  // Render loop
  const clock = new THREE.Clock()

  const animate = () => {
    const elapsedTime = clock.getElapsedTime()


    const branch1 = scene.getObjectByName('branch1')
    const branch2 = scene.getObjectByName('branch2')

    if (branch1 && branch2) {
      branch1.position.y += Math.sin(elapsedTime + 0.5) * 0.05
      branch2.position.y += Math.sin(elapsedTime * 1.1) * 0.1
    }
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  animate()

  // Resizing
  window.addEventListener('resize', () => {
    size = calculateCanvasSize(canvasAspectRatio)

    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()

    renderer.setSize(size.width, size.height)
  })
}
