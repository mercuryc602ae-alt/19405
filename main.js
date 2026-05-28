{\rtf1\ansi\ansicpg1252\cocoartf2869
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js";\
import \{ OrbitControls \} from "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/controls/OrbitControls.js";\
\
const scene = new THREE.Scene();\
scene.background = new THREE.Color(0xf4f4f7);\
\
const camera = new THREE.PerspectiveCamera(\
  60,\
  window.innerWidth / window.innerHeight,\
  0.1,\
  1000\
);\
\
camera.position.set(0, 0, 16);\
\
const renderer = new THREE.WebGLRenderer(\{\
  antialias: true,\
  alpha: true\
\});\
\
renderer.setSize(window.innerWidth, window.innerHeight);\
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\
document.body.appendChild(renderer.domElement);\
\
const controls = new OrbitControls(camera, renderer.domElement);\
controls.enableDamping = true;\
controls.dampingFactor = 0.06;\
controls.enablePan = false;\
controls.minDistance = 5;\
controls.maxDistance = 35;\
\
const raycaster = new THREE.Raycaster();\
const mouse = new THREE.Vector2();\
\
const textureLoader = new THREE.TextureLoader();\
const clickableWorks = [];\
\
const artworks = [\
  \{\
    title: "Work 1",\
    description: "Short description of this artwork.",\
    image: "artworks/work1.jpg"\
  \},\
  \{\
    title: "Work 2",\
    description: "Another artwork description.",\
    image: "artworks/work2.jpg"\
  \},\
  \{\
    title: "Work 3",\
    description: "Mixed media / digital study.",\
    image: "artworks/work3.jpg"\
  \}\
];\
\
// Add more artworks by adding more objects above.\
\
function randomOnSphere(radius) \{\
  const theta = Math.random() * Math.PI * 2;\
  const phi = Math.acos(2 * Math.random() - 1);\
\
  return new THREE.Vector3(\
    radius * Math.sin(phi) * Math.cos(theta),\
    radius * Math.sin(phi) * Math.sin(theta),\
    radius * Math.cos(phi)\
  );\
\}\
\
artworks.forEach((work, index) => \{\
  const texture = textureLoader.load(work.image);\
  texture.colorSpace = THREE.SRGBColorSpace;\
\
  const material = new THREE.MeshBasicMaterial(\{\
    map: texture,\
    side: THREE.DoubleSide,\
    transparent: true\
  \});\
\
  const aspect = 1.4;\
  const height = 1.7 + Math.random() * 0.8;\
  const width = height * aspect;\
\
  const geometry = new THREE.PlaneGeometry(width, height);\
  const mesh = new THREE.Mesh(geometry, material);\
\
  const radius = 7 + Math.random() * 4;\
  mesh.position.copy(randomOnSphere(radius));\
\
  mesh.lookAt(0, 0, 0);\
\
  mesh.rotation.z += (Math.random() - 0.5) * 1.4;\
  mesh.rotation.x += (Math.random() - 0.5) * 0.4;\
  mesh.rotation.y += (Math.random() - 0.5) * 0.4;\
\
  mesh.userData = work;\
\
  scene.add(mesh);\
  clickableWorks.push(mesh);\
\});\
\
function onClick(event) \{\
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;\
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;\
\
  raycaster.setFromCamera(mouse, camera);\
\
  const hits = raycaster.intersectObjects(clickableWorks);\
\
  if (hits.length > 0) \{\
    const work = hits[0].object.userData;\
\
    document.getElementById("work-title").textContent = work.title;\
    document.getElementById("work-description").textContent = work.description;\
    document.getElementById("work-panel").classList.add("visible");\
  \}\
\}\
\
window.addEventListener("click", onClick);\
\
document.getElementById("close-panel").addEventListener("click", () => \{\
  document.getElementById("work-panel").classList.remove("visible");\
\});\
\
function animate() \{\
  requestAnimationFrame(animate);\
\
  scene.rotation.y += 0.0008;\
\
  controls.update();\
  renderer.render(scene, camera);\
\}\
\
animate();\
\
window.addEventListener("resize", () => \{\
  camera.aspect = window.innerWidth / window.innerHeight;\
  camera.updateProjectionMatrix();\
\
  renderer.setSize(window.innerWidth, window.innerHeight);\
\});}