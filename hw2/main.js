// Auther: Hsiao, Chiang
// Creation date: 2023/10/09

import * as THREE from 'three';


function initScene() {
    // Initial the camera, scene, and render and return them when called in main() function

    const width = 640;  // Windows width
    const high = 480;  // Windows high

    // Create camera
    const camera = new THREE.OrthographicCamera(width / - 2, width / 2, high / 2, high / - 2, -10, 1000);
    camera.position.set(0, 0, 0);

    // Create grid
    const gridHelper = new THREE.GridHelper(500, 10);
    gridHelper.geometry.rotateX(- Math.PI / 2);  // Rotate the y axis make a grid

    // Create scene
    const scene = new THREE.Scene();
    scene.add(camera);
    scene.add(gridHelper);

    // Create render
    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(width, high);
    document.body.appendChild(renderer.domElement);

    return { camera, scene, renderer };
}

function drawCircle(scene) {
    // Geometry
    const circleGeometry = new THREE.CircleGeometry(150, 32);  //radius 150 and split to 32
    // Material
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xA9A9A9 });
    // Mesh
    const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    circleMesh.position.set(100, 50, 0);

    scene.add(circleMesh)
}

function drawPoint(scene) {
    // Geometry
    const pointGeometry = new THREE.CircleGeometry(2, 32);  //radius 2 and split to 32
    // Material
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // Mesh
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.position.set(100, 50, 0);

    scene.add(pointMesh)
}

function drawHourHand(scene) {
    const vertices = [];
    vertices.push(new THREE.Vector3(0, -15, 0)); //0
    vertices.push(new THREE.Vector3(8, 0, 0)); //1
    vertices.push(new THREE.Vector3(0, 85, 0)); //2
    vertices.push(new THREE.Vector3(-8, 0, 0)) //3
    const indices = [
        0, 1, 2,
        0, 2, 3
    ]

    // Geomatry
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);

    // Material
    const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(100, 50, 0)

    scene.add(mesh)

    return mesh
}

function drawMinHand(scene) {
    const vertices = [];
    vertices.push(new THREE.Vector3(0, -15, 0)); //0
    vertices.push(new THREE.Vector3(12, 0, 0)); //1
    vertices.push(new THREE.Vector3(0, 130, 0)); //2
    vertices.push(new THREE.Vector3(-12, 0, 0)) //3
    var indices = [
        0, 1, 2,
        0, 2, 3,
    ]

    // Geomatry
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(vertices);
    geometry.setIndex(indices);

    // Material
    const material = new THREE.MeshBasicMaterial({ color: 0x00FF00});

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(100, 50, 0)

    scene.add(mesh)

    return mesh
}

function animateClockHands(hourHand, minHand,renderer, scene, camera, speed) {
    // Use inner funtion to make sure the frame can keep calling.
    function animate() {
        requestAnimationFrame(animate);
        // Rotate the axis z to let the hand rotated.
        hourHand.rotation.z -= speed;  
        minHand.rotation.z -= speed * 12;

        renderer.render(scene, camera);
    }
    
    animate()
}

function main() {
    const speed = 0.01  // Can change the rotation speed

    // Create variables for camera, scene, and render
    const { camera, scene, renderer } = initScene();
    // Draw Circle to preset clock
    drawCircle(scene);
    // Creat variables of object for animation
    const min = drawMinHand(scene);
    const hour = drawHourHand(scene);
    // Draw a center point of clock
    drawPoint(scene);
    // Render the scene and camera. Acually this line can keep selectivity because I have write in animateClockHands() already
    // But I keep it if the animateClockHands() is remarked. The scene can not present. 
    renderer.render(scene, camera);
    // Draw the animation
    animateClockHands(hour, min, renderer, scene, camera, speed)
}

main();