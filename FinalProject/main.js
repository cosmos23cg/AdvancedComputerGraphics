import * as THREE from 'three';
import { MTLLoader } from 'MTLLoader';
import { OBJLoader } from 'OBJLoader';
import { DRACOLoader } from 'DRACOLoader';
import { GLTFLoader } from 'GLTFLoader';
import { RGBELoader } from 'RGBELoader';
import { OrbitControls } from 'OrbitControls';


class RacingSimulation {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.perCamFull = null;
        this.perCam = null;
        this.stereoCam = null;
        this.controls = null;
        this.trackCoordinates = [];
        this.trackNormals = [];
        this.trackPointIdx = 0;
        this.direction = 1;
        this.border = 16;

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLight();
        this.setupBackground();
        this.readGLTF();
        this.readMTL();
        this.readXYZ();

        this.keydownEvent();
        this.handleResize();

        this.animateFrame();
    }
    

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer();
        // this.renderer.shadowMap.enabled = false;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(window.innerWidth - this.border, window.innerHeight - this.border);

        document.body.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();

        const axesHelper = new THREE.AxesHelper(100);
        this.scene.add(axesHelper);
    }

    setupCamera() {
        // this perspective camera includes the full track view
        this.perCamFull = new THREE.PerspectiveCamera(
            45,
            (window.innerWidth - this.border) / (window.innerHeight - this.border),
            0.1,
            10000
        );
        this.perCamFull.position.set(0, 0, 1200);
        this.scene.add(this.perCamFull);
        this.controls = new OrbitControls(this.perCamFull, this.renderer.domElement);

        // this perspective camera is the center camera of stereo camera
        this.perCam = new THREE.PerspectiveCamera(
            45,
            (window.innerWidth - this.border) / (window.innerHeight - this.border),
            0.1,
            1000
        );
        this.scene.add(this.perCam);

        // setup a stereo cam, will be update in animation
        this.stereoCam = new THREE.StereoCamera();
    }

    setupLight() {
        const light = new THREE.DirectionalLight(0xffffff, 7);
        light.position.set(100, 100, 100).normalize();
        // light.castShadow = true;
        // light.shadow.mapSize.width = 512;
        // light.shadow.mapSize.height = 512;
        // light.shadow.camera.near = 10;
        // light.shadow.camera.far = 10000;
        this.scene.add(light);
    }

    setupBackground() {
        const hdrPath = './models/industrial_sunset_puresky.hdr';

        new RGBELoader().load(hdrPath, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        });
    }

    readGLTF() {
        const glbPath = './models/MarioKartStadium.glb';

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('./lib/jsm/libs/draco/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load(glbPath, (glb) => {
            const glbMesh = glb.scene;
            glbMesh.scale.setScalar(1);
            glbMesh.name = 'MarioKartStadiumGLTF';
            this.scene.add(glbMesh);
        });
    }

    readMTL() {
        const mtlPath = './models/TaxiCar.mtl';
        const objPath = './models/TaxiCar.obj';

        new MTLLoader().load(mtlPath, (materials) => {
            materials.preload();
            new OBJLoader().setMaterials(materials).load(
                objPath,
                (object) => {
                    object.name = 'MyTaxiOBJ';
                    object.scale.setScalar(0.6);
                    // object.castShadow = true;
                    // object.receiveShadow = true;
                    this.scene.add(object);
                }
            );
        });
    }

    readXYZ() {
        const xyzFilePath = './models/TrackCenter.xyz';

        // use fetch function to obtain the normal vector from column 3, 4, 5
        fetch(xyzFilePath)
            .then((response) => response.text())
            .then((data) => {
                const lines = data.split('\n'); // split the row

                for (const line of lines) {
                    const values = line.trim().split(/\s+/).map(parseFloat); // return a list of lines

                    if (values.length >= 6) { 
                        const subCor = new THREE.Vector3(
                            values[0], 
                            values[1], 
                            values[2]
                        );
                        // fetch and conver degree to radients
                        const subNor = new THREE.Vector3(
                            THREE.MathUtils.degToRad(values[3]),
                            THREE.MathUtils.degToRad(values[4]),
                            THREE.MathUtils.degToRad(values[5])
                        ).normalize();

                        this.trackCoordinates.push(subCor);
                        this.trackNormals.push(subNor);
                    }
                }
                console.log(`XYZ file ${xyzFilePath} has been loaded.`);
            })
            .catch((error) => console.error('Error loading XYZ file:', error));
    }

    keydownEvent() {
        // detect the keyboard event for motivation
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') {
                this.direction = 1;
            } else if (event.key === 'ArrowDown') {
                this.direction = -1;
            }
        });
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.perCam.aspect = (window.innerWidth - this.border) / (window.innerHeight - this.border);
            this.perCam.updateProjectionMatrix();   
            this.renderer.setSize(window.innerWidth - this.border, window.innerHeight - this.border);
        });
    }
    


    animateFrame() {
        const taxiObj = this.scene.getObjectByName('MyTaxiOBJ', true);

        if (taxiObj && this.trackPointIdx >= 0 && this.trackPointIdx < this.trackCoordinates.length) {
            const curTrkCor = this.trackCoordinates[this.trackPointIdx];
            const curTrkNor = this.trackNormals[this.trackPointIdx];

            // useing the localToWorld to add the distance then apply back the world oordiante
            // Note: taxiObj's initial coordinate is on the x-axis, so the translation is added along the x-axis
            const laneCenter = new THREE.Vector3();
            laneCenter.copy(taxiObj.localToWorld(new THREE.Vector3(11, 0, 0)));
            laneCenter.sub(taxiObj.position).add(curTrkCor);
            // Calculate the distance vector between the lane center and the taxi object's position
            const ds = new THREE.Vector3();
            ds.subVectors(laneCenter, taxiObj.position);
            // Create a translation matrix to move the taxi object based on the calculated distance vector
            const translationMat = new THREE.Matrix4();
            translationMat.makeTranslation(ds);
            taxiObj.applyMatrix4(translationMat);

            // rotation align the track by using normal vector(converted to radient)
            let origVtr = new THREE.Vector3();
            let pivot = new THREE.Vector3();
            taxiObj.getWorldDirection(origVtr);  // call getWorldDirection on Model to obtain its up direction in global coordinates
            pivot.crossVectors(origVtr, curTrkNor).normalize();  // calculate the cross product between alignVtr (model's up direction) and trackLocus.nor (track normal)
            let rotationAngle = origVtr.angleTo(curTrkNor);  // calculate angle between model and track normal vector
            taxiObj.rotateOnWorldAxis(pivot, rotationAngle);  // make rotation

            // make the direction and rotate if the axis change
            const forwardDirection = new THREE.Vector3();
            if (this.direction === 1){
                forwardDirection.set(0, -1, 0)  // when direction is forward
            }else{
                forwardDirection.set(0, 1, 0)  // when direction is backward
            }
            // forwardDirection.applyQuaternion(taxiObj.quaternion);
            // pivot.copy(forwardDirection).cross(ds).normalize();
            // rotationAngle = forwardDirection.angleTo(ds);
            // taxiObj.rotateOnWorldAxis(pivot, rotationAngle);
            origVtr = taxiObj.localToWorld(forwardDirection).sub(taxiObj.position); // get model direction in global coordinates
            (pivot.copy(origVtr).cross(ds)).normalize(); // caculate cross product between distance and model direction
            rotationAngle = origVtr.angleTo(ds);  // caculate angle between distance and car direction
            taxiObj.rotateOnWorldAxis(pivot, rotationAngle) // make rotation

            // camera setting
            const camPosition = new THREE.Vector3(0, 100, 20); // set the postion behind the taxi object
            this.perCam.position.copy(taxiObj.localToWorld(camPosition)); // set the postion behind the taxi object
            const upVector = taxiObj.localToWorld(new THREE.Vector3(0, -1, 0)).sub(taxiObj.position).normalize(); // make the camera keep up
            this.perCam.up.copy(upVector);
            this.perCam.lookAt(taxiObj.position);
            
            // seens that perspective camera be actived can effect the stereo cam
            this.renderer.render(this.scene, this.perCam);
            // this.renderer.render(this.scene, this.perCamFull);

            // make the stereo camera setting
            const size = new THREE.Vector2();
            this.renderer.getSize(size);
            this.stereoCam.update(this.perCam);
            this.stereoCam.eyeSep = 0.064;

            this.renderer.setScissorTest(true);

            this.renderer.setScissor(0, 0, size.width / 2, size.height);
            this.renderer.setViewport(0, 0, size.width / 2, size.height);
            this.renderer.render(this.scene, this.stereoCam.cameraL);

            this.renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
            this.renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
            this.renderer.render(this.scene, this.stereoCam.cameraR);

            this.trackPointIdx += this.direction;
        } else {
            if (this.direction === 1) {
                this.trackPointIdx = 0;
            } else {
                this.trackPointIdx = this.trackCoordinates.length - 1;  // to ensure trackPoint in the limit
            }
        }

        this.controls.update();
        requestAnimationFrame(() => this.animateFrame());
    }
}

const racingSimulation = new RacingSimulation();
racingSimulation;
