// Create Date: 31/10/2023
// Creater: Chiang Hsiao

import * as THREE from 'three';
import { MTLLoader } from 'MTLLoader';
import { OBJLoader } from 'OBJLoader';
import { DRACOLoader } from 'DRACOLoader';
import { GLTFLoader } from 'GLTFLoader';
import { XYZLoader } from 'XYZLoader';

const w = 1080;
const h = 720;
const subPoints = [];
let currentPointIndex = 0;

function initScene() {
    // create scene, camera, light
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(w / - 2, w / 2, h / 2, h / - 2, -1000, 1000);
    camera.position.set(0, 0, 0);


    // read gltf file
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./lib/jsm/libs/draco/');

    var loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader);
    loader.load('./models/MarioKartStadium.glb', function (glb) {
        var glbMesh = glb.scene
        glbMesh.scale.setScalar(1);
        glbMesh.name = 'MyGLTF'
        scene.add(glbMesh)
    })


    // read obj file
    new MTLLoader().load('./models/TaxiCar.mtl', function (materials) {
        materials.preload();
        new OBJLoader().setMaterials(materials).load(
            './models/TaxiCar.obj',
            function (object) {
                object.name = 'MyTaxiOBJ';
                object.scale.setScalar(0.7);
                scene.add(object);
            });
    });

    // read XYZ file
    const xyzLoader = new XYZLoader();
    xyzLoader.load('./models/TrackCenter.xyz', function (geometry) {
        // console.log(geometry);
        const TrackMetrial = new THREE.PointsMaterial({ vertexColors: THREE.vertexColors });
        const TrackPoint = new THREE.Points(geometry, TrackMetrial);
        TrackPoint.name = 'MyTrackXYZ';
        console.log(TrackPoint);
        const positions = TrackPoint.geometry.attributes.position.array;
        // console.log(positions);

        // fetch every 3 points to a sub array
        for (let i = 0; i < positions.length; i += 3) {
            const subArr = positions.slice(i, i + 3);
            // console.log(subArr);
            var subPoint = {
                x: subArr[0],
                y: subArr[1],
                z: subArr[2]
            };
            // console.log(subPoint);
            subPoints.push(subPoint);
        }
        // console.log(subPoints);
        TrackPoint.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0x000000), 3));
        scene.add(TrackPoint);
    });

    const axisHelper = new THREE.AxesHelper(100);
    const light = new THREE.PointLight(0xffffff, 10, 10000, 0.1);
    light.position.set(100, -100, 500);
    const lightHelper = new THREE.PointLightHelper(light);

    scene.add(camera);
    scene.add(axisHelper);
    scene.add(light);
    scene.add(lightHelper);

    return { camera, scene };
}

function animateFrame(render, scene, camera) {
    const object = scene.getObjectByName('MyTaxiOBJ', true);
    const transition = 7;
    if (object){
        if (currentPointIndex  < subPoints.length) {
            const currentPoint = subPoints[currentPointIndex];
            if (currentPointIndex + 1 === subPoints.length){
                currentPointIndex = 0;
            }
            // const angle = Math.atan2(currentPoint.ny, currentPoint.nx);
            // // console.log(angle);

            // set car direction
            const nextPoint = subPoints[currentPointIndex + 1];
            const currentPointVector = new THREE.Vector3(currentPoint.x + transition, currentPoint.y, currentPoint.z);
            const nextPointVector = new THREE.Vector3(nextPoint.x + transition, nextPoint.y, nextPoint.z);
            const carDirection = new THREE.Vector3().subVectors(nextPointVector, currentPointVector).normalize();

            // set car rotation
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(up, carDirection);

            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationFromQuaternion(quaternion);
            const rotationQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);

            object.setRotationFromQuaternion(rotationQuaternion);
            // console.log(currentPoint);
            object.position.set(currentPointVector.x, currentPointVector.y, currentPointVector.z);
            currentPointIndex ++;
        }
    }

    render.render(scene, camera);
    requestAnimationFrame(() => animateFrame(render, scene, camera));
}

function main() {
    const { camera, scene } = initScene();

    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x888888, 1);
    renderer.setSize(w, h);
    document.body.appendChild(renderer.domElement);

    animateFrame(renderer, scene, camera);
}

main();