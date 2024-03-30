import * as THREE from 'three';
import {ARButton} from 'three/examples/jsm/webxr/ARButton'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'


let loadedModel = null;
let loadedModel2 = null;
let hitTestSource = null;
let hitTestSourceRequested = false;
let hitPosition = new THREE.Vector3();


const loadMainModel = () =>{
  let gltfLoader2 = new GLTFLoader();
  gltfLoader2.load('/models/color-holi.glb', (gltf)=>{ 
    loadedModel2 = gltf.scene
    loadedModel2.scale.set(0.5,0.5,0.5)
    loadedModel2.position.set(-1.5,-1,-1)
    loadedModel2.rotateX(Math.PI/2)
    scene.add(loadedModel2)
  })
}



let gltfLoader = new GLTFLoader();
gltfLoader.load('/models/confetti.glb', (gltf)=>{ 
  loadedModel = gltf.scene
  loadedModel.scale.set(5,5,5)
  loadedModel.position.set(0,10,0)
})

const scene  = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const light = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(light)

const directionalLight = new THREE.DirectionalLight(0xff0000, 5);
directionalLight.position.set(0,3,0);
directionalLight.castShadow = true;
scene.add(directionalLight)

let reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({color: 0xffffff * Math.random()})
)
reticle.name = "reticle"

reticle.visible = false;
reticle.matrixAutoUpdate = false;
scene.add(reticle)

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height,0.1, 1000)
camera.position.set(0,0,5)
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
})


renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement)
const button = ARButton.createButton(renderer,{requiredFeatures: ['hit-test']})
button.style.backgroundColor = "#f0d637";
button.style.borderRadius = '20px';
button.style.removeProperty('opacity');
button.style.fontWeight = 'bold';
button.style.fontSize = '20px';
button.style.fontFamily = 'Comic Sans MS, cursive';
button.style.color = 'black';
button.style.animation = 'pulse 2s infinite';
document.body.appendChild(button);

button.addEventListener('click',()=>{
  loadMainModel();
})

let controller = renderer.xr.getController(0);
controller.addEventListener('selectstart',onSelect)
scene.add(controller)

function onSelect(){
  if(reticle.visible && loadedModel){
    const model = loadedModel.clone();
    // model.position.setFromMatrixPosition(hitPosition.matrix)
    model.position.copy(hitPosition)
    model.position.y += 2;
    model.position.x += 1;
    model.position.multiplyScalar(40)
    model.name = "loadedModel"
    console.log(hitPosition)
    console.log(model.position)
    model.position.z += -35
    scene.add(model)
    model.lookAt(camera.position);
    model.rotateX(Math.PI/2 + Math.PI/6)
    
  }
}


renderer.setAnimationLoop(render)

function render(timestamp, frame){
  if(frame){
    const referenceSpace = renderer.xr.getReferenceSpace()
    const session = renderer.xr.getSession()

    if(hitTestSourceRequested === false){

      session.requestReferenceSpace('viewer').then(referenceSpace => {
        session.requestHitTestSource({space: referenceSpace}).then(source => hitTestSource = source)
      })
      hitTestSourceRequested = true

      session.addEventListener('end', () => {
        hitTestSourceRequested = false
        hitTestSource = null
      })
    }

    if(hitTestSource){
      const hitTestResults = frame.getHitTestResults(hitTestSource)
      if(hitTestResults.length){
        const hit = hitTestResults[0]
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)
        const hitMatrix = new THREE.Matrix4().fromArray(hit.getPose(referenceSpace).transform.matrix);
        hitPosition = new THREE.Vector3();
        hitPosition.setFromMatrixPosition(hitMatrix);
      }else{
        reticle.visible = false;
      }
    }
  }

  scene.children.forEach(object=>{
    if(object.name === "loadedModel"){
      if(object.position.y > -40){
        object.position.y -= 5;
      }else{
        object.position.y = -40;
        scene.remove(object)
      }
    }
  })
  renderer.render(scene, camera)
}

window.addEventListener('resize',()=>{
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(window.devicePixelRatio);
})