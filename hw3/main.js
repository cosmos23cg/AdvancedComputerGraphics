import * as THREE from 'three';
import { DRACOLoader } from 'DRACOLoader';
import { GLTFLoader } from 'GLTFLoader';
import { OrbitControls } from 'OrbitControls';

var renderer;
var scene;
var camera1, camera2;
var controls;
let activeCamera;

const len = 32  //window padding value
const earthCenter = new THREE.Vector3(110, 40, 10);  //earth center coordinate
const radius = 50.4;  //distance between camera and earth center

const axis = new THREE.Vector3(0, 0, 1);  //Z-axis
const nextPosition = new THREE.Vector3();  //the next position of the current point. 
const lightPosition = new THREE.Vector3(0, 30, 0);  //light position

// Setup the render
function setupRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth - len, window.innerHeight - len);
    document.body.appendChild(renderer.domElement);
}

//Setup the scene
function setupScene() {
    scene = new THREE.Scene();
    renderer.setClearColor(0x888888, 1);
}

//Load GLTF model (earth)
function loadGLTFModel() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./lib/jsm/libs/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load('./Earth.glb', function (glb) {
        const glbMesh = glb.scene;
        glbMesh.scale.setScalar(1);
        glbMesh.name = 'MyglTF';
        scene.add(glbMesh);
    });
}

//Setup camera. There are two different FOV, camera1 is entire earth, camera2 is flying camera
function setupCamera(cameraOption) {
    //Camera1
    camera1 = new THREE.PerspectiveCamera(45, (window.innerWidth - len) / (window.innerHeight - len), 5, 3000);
    controls = new OrbitControls(camera1, renderer.domElement);  //operate the camera
    camera1.position.set(10, 30, 500);  //Initail position

    //Camera2
    camera2 = new THREE.PerspectiveCamera();
    camera2.fov = 45;
    camera2.aspect = (window.innerWidth - len) / (window.innerHeight - len);
    camera2.near = 0.1;
    camera2.far = 30;

    //Translate the camera2 to the specific positoin
    const matrix = new THREE.Matrix4;
    matrix.makeTranslation(earthCenter.x + radius, earthCenter.y, earthCenter.z);
    camera2.applyMatrix4(matrix);

    scene.add(camera1);
    scene.add(camera2);
    // The statement for changeing the camera view
    if (cameraOption === 'c1') {
        activeCamera = camera1;
    } else if (cameraOption === 'c2') {
        activeCamera = camera2;
    } else {
        console.error('Invalid camera option. Please use "c1" or "c2".');
        return;
    }

    //Create the camera helper
    const camera2Helper = new THREE.CameraHelper(camera2);
    camera2Helper.name = 'MyCamera2Helper';
    scene.add(camera2Helper);
}

//Setup the axis helper
function setupAxisHelpers() {
    const axisHelper = new THREE.AxesHelper(200);
    scene.add(axisHelper);
}

//Setup the light
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 10)

    const light = new THREE.PointLight(0xffffff, 10, 3000, 0);
    light.name = 'MyLight';
    light.position.set(camera2.position.x, camera2.position.y, camera2.position.z); //initialize the position same as camera2, will translate in animateFrame()

    // scene.add(ambientLight)
    scene.add(light);

    const lighthelper = new THREE.PointLightHelper(light);
    scene.add(lighthelper);
}

//Setup the action if the render size changed
function handleResize() {
    window.addEventListener('resize', function () {
        activeCamera.aspect = window.innerWidth - len / window.innerHeight - len;
        activeCamera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth - len, window.innerHeight -len);
    });
}

//A part of funtion for animateFrame
function updateCameraPosition() {
    //To operate the next postion from current position by using degree
    nextPosition.copy(camera2.position);  //Duplicate the camera current position
    nextPosition.sub(earthCenter);  //Subtract the earth center coordinate within vector3 that makes the camera to rotate the origin coordinate
    nextPosition.applyAxisAngle(axis, Math.PI / 180.0 * 0.3);  //Rotate the camera by fixed z-axis
    nextPosition.add(earthCenter);  //Add the earth center coordinate within vector3 to make the camera2 back to the position that i want

    //Due to the camera will upside down when the camera y axis is lower than earth center axis, so this statement is to make sure the earth viewing keep in botton
    if (nextPosition.y <= earthCenter.y) {
        camera2.up.set(0, -1, 0);
    } else {
        camera2.up.set(0, 1, 0);
    }

    camera2.lookAt(nextPosition);  //Make the camera2 look at the next postion
    camera2.position.copy(nextPosition);  //Finially apply the next positon on current position. Then keep looping
}

//A part of funtion for animateFrame
function updateLightPosition() {
    const light = scene.getObjectByName("MyLight");
    // Check if camera2 is in the scene
    if (light) {
        lightPosition.copy(new THREE.Vector3(0, 30, 0));
        lightPosition.applyMatrix4(camera2.matrixWorld);
        light.position.copy(lightPosition);
    } else {
        console.warn("Camera2 not found in the scene. Light position not updated.");
    }
}

function animateFrame() {
    updateCameraPosition();
    updateLightPosition();
    controls.update();
    renderer.render(scene, activeCamera);
    requestAnimationFrame(animateFrame);
}

function main(cameraOption) {
    setupRenderer();
    setupScene();
    loadGLTFModel();
    setupCamera(cameraOption);
    setupAxisHelpers();
    setupLights();
    handleResize();
    animateFrame();
}

const c1 = "c1";  //Entire earth camera
const c2 = "c2";  //Flying camera

//Enter c1 or c2 to change the view
main(c2);
