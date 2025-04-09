import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { ThreeContext } from './types';

interface DragEventHandlers {
    onDragStart: (event: THREE.Event) => void;
    onDragEnd: (event: THREE.Event) => void;
}


export const initializeThreeScene = (
    mountElement: HTMLDivElement,
    draggableObjects: THREE.Object3D[],
    dragHandlers: DragEventHandlers
): ThreeContext & { cleanup: () => void } => {

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF9F6); 

    const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        2000 
    );
    
    camera.position.y = 20;
    camera.position.z = 10;
    camera.rotation.x = -0.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountElement.appendChild(renderer.domElement); 

   
    const pointerLockControls = new PointerLockControls(camera, renderer.domElement); 
    scene.add(pointerLockControls.getObject()); 

   
    const dragControls = new DragControls(
        draggableObjects,
        camera,
        renderer.domElement
    );
    dragControls.addEventListener('dragstart', dragHandlers.onDragStart);
    dragControls.addEventListener('dragend', dragHandlers.onDragEnd);


    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const light = new THREE.PointLight(0xffffff, 0.8, 150); 
    light.position.set(10, 20, 10); 
    scene.add(light);

    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
    scene.add(gridHelper);

    const snapRadiusGeometry = new THREE.SphereGeometry(3, 16, 16); 
    const snapRadiusMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        opacity: 0.3,
        transparent: true
    });
    const snapRadius = new THREE.Mesh(snapRadiusGeometry, snapRadiusMaterial);
    snapRadius.visible = false; 
    scene.add(snapRadius);


    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);


    const cleanup = () => {
        window.removeEventListener('resize', onWindowResize);

        dragControls.removeEventListener('dragstart', dragHandlers.onDragStart);
        dragControls.removeEventListener('dragend', dragHandlers.onDragEnd);
        dragControls.dispose();
    
        pointerLockControls.dispose();
  
        if (renderer.domElement.parentNode === mountElement) {
            mountElement.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };

    return {
        scene,
        camera,
        renderer,
        pointerLockControls,
        dragControls,
        snapRadius,
        light, 
        gridHelper,
        ambientLight,
        cleanup
    };
};