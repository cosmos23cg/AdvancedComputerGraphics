//Auther: Chiang Hsiao
//Date: 2023/12/01

import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

//This class can prenet the Tiny planet effect when the image loaded via panormic image.
//When the camera fov will be changed from 150 to 45 if the camera legth under 20.
class TinyPlanet{
    constructor(){
        //setup scene
        this.scene = new THREE.Scene();

        //setup camera
        this.camera = new THREE.PerspectiveCamera(
            150,
            window.innerWidth/ window.innerHeight,
            5,
            3000
        );
        this.camera.position.set(0, 85, 0);
        
        //setup renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
        document.body.appendChild(this.renderer.domElement);

        //setup control
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        //call the function 
        this.setupEventListeners();
        this.loadTexture();
        this.animateFrame();
    }

    //load the panormic image as the texture to render the sphere
    loadTexture() {
        const textureLoader = new THREE.TextureLoader();
        const sphereGeometry = new THREE.SphereGeometry(100, 64, 64);

        textureLoader.load(
            "./20230704_095421.jpg",
            (texture) => {
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.BackSide  // which side of faces will be redered
                    // side: THREE.DoubleSide
                });

                //made the mesh
                const sphereMesh = new THREE.Mesh(sphereGeometry, material);
                this.scene.add(sphereMesh);
            },
            undefined,
            //error message
            (err) => {
                console.error("An error happened.");
            }
        );
    }

    //modifed the windows size when changed
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth - 16, window.innerHeight - 16);
    }
    
    //Let the fov changed more smooth
    lerp(start, end, alpha) {
        return start + alpha * (end - start);
    }

    animateFrame(){
        this.controls.update();
        console.log("Camera length: ", this.camera.position.length())

        //control the camera to be unable to exit the sphere
        const limit = 110; // camera.position.length limit
        if (this.camera.position.length() > limit) {
            this.camera.position.normalize().multiplyScalar(limit); // normalizeing the postion and scaling the lengh
        } 

        // if (this.camera.position.length() < 20) {
        //     this.camera.fov = 45;
        // } else {
        //     this.camera.fov = 150;
        // }

        const targetFov = this.camera.position.length() < 20 ? 45 : 150; // if the camera length under 20, fov is 45 else 150
        this.camera.fov = this.lerp(this.camera.fov, targetFov, 0.1); // adjust the interpolation factor as needed
        this.camera.updateProjectionMatrix(); // Update the projection matrix after changing FOV
        console.log("Camera fov: ",this.camera.fov)

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animateFrame());        
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize(), false);
    }

}

const app = new TinyPlanet();
