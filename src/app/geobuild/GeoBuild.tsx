'use client';

import React, { Component } from 'react';

// Import Three.js safely for browser-only execution with proper TypeScript support
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';

// Define interfaces for state and objects
interface GeoBuildState {
  mouseX: number | null;
  mouseY: number | null;
  isVisible: boolean;
  showInstructions: boolean;
}

// Define a union type for valid object types
type ObjectType = 'floor' | 'wall' | 'roof' | 'door';

interface SceneObject {
  obj: THREE.Object3D;
  objType: ObjectType;
  side?: string;
}

// Helper functions
const objIns = (vThree: THREE.Vector3, objType: ObjectType): THREE.Object3D | null => {  
  if (!(vThree instanceof THREE.Vector3)) {
    throw new Error('vThree must be an instance of THREE.Vector3');
  }
  const pObj = new THREE.Object3D();
  
  if (objType === 'floor') {
    const objGeometry = new THREE.BoxGeometry(10, 5, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0xEEA47F });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const obj = new THREE.Mesh(objGeometry, material);
    const wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
    obj.position.set(vThree.x, vThree.y, vThree.z);
    pObj.add(obj);
    return pObj;
  }
  
  if (objType === 'wall') {
    const objGeometry = new THREE.BoxGeometry(10, 10, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0x0539CFF });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const obj = new THREE.Mesh(objGeometry, material);
    const wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
    obj.position.set(vThree.x, vThree.y, vThree.z);
    pObj.add(obj);
    return pObj;
  }
  
  if (objType === 'roof') {
    const objGeometry = new THREE.BoxGeometry(10, 0.2, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x317773 });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    const obj = new THREE.Mesh(objGeometry, material);
    const wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
    obj.position.set(vThree.x, vThree.y, vThree.z);
    pObj.add(obj);
    return pObj;
  }
  
  if (objType === 'door') {
    const wall = new THREE.Shape();
    wall.moveTo(-5, -5);
    wall.lineTo(-5, 5);
    wall.lineTo(5, 5);
    wall.lineTo(5, -5);
    wall.lineTo(-5, -5);

    const door = new THREE.Shape();
    door.moveTo(-2.5, -5);
    door.lineTo(-2.5, 2);
    door.lineTo(2.5, 2);
    door.lineTo(2.5, -5);
    door.lineTo(-2.5, -5);
    wall.holes.push(door);

    const extrudeSettings = { depth: 0.2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(wall, extrudeSettings);
    // Use a solid color for the door
    const material = new THREE.MeshBasicMaterial({ color: 0xCC313D });
    const mesh = new THREE.Mesh(geometry, material);

    // Add a wireframe version on top
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    mesh.position.set(vThree.x, vThree.y, vThree.z);
    mesh.add(wireframe);
    pObj.add(mesh);
    
    // Add a dummy box geometry that we'll use for consistent handling with other objects
    // This is invisible but helps with snapping logic
    const dummyGeometry = new THREE.BoxGeometry(10, 10, 0.2);
    const dummyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xCC313D, 
      transparent: true, 
      opacity: 0 
    });
    const dummyMesh = new THREE.Mesh(dummyGeometry, dummyMaterial);
    dummyMesh.position.copy(mesh.position);
    dummyMesh.visible = false;
    mesh.userData.dummyMesh = dummyMesh;
    pObj.add(dummyMesh);
    
    return pObj;
  }
  
  // Default fallback - create a simple cube
  const objGeometry = new THREE.BoxGeometry(5, 5, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0x8AAAE5 });
  const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
  const obj = new THREE.Mesh(objGeometry, material);
  const wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
  obj.add(wireframeMesh);
  obj.position.set(vThree.x, vThree.y, vThree.z);
  pObj.add(obj);
  return pObj;
};

// Add snap points to objects
const addSnaps = (selectedObject: SceneObject, isVisible: boolean): SceneObject[] => {
  const snapObjs: SceneObject[] = [];
  const objGeometry = new THREE.BoxGeometry(1, 1, 1);
  const matT = new THREE.MeshBasicMaterial({ color: 0xf00fff });
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  if (selectedObject.objType === 'floor') {
    // Add snap points to floor object
    const snapPositions = {
      right: new THREE.Vector3(5, 2, 0),
      back: new THREE.Vector3(0, 2, 5),
      front: new THREE.Vector3(0, 2, -5),
      left: new THREE.Vector3(-5, 2, 0),
    };

    const q = new THREE.Quaternion();
    q.copy(selectedObject.obj.quaternion);

    snapPositions.right.applyQuaternion(q);
    snapPositions.left.applyQuaternion(q);
    snapPositions.front.applyQuaternion(q);
    snapPositions.back.applyQuaternion(q);

    const snapObjLeft = new THREE.Mesh(objGeometry, mat);
    snapObjLeft.position.copy(selectedObject.obj.position).add(snapPositions.left);
    snapObjLeft.quaternion.copy(selectedObject.obj.quaternion);
    snapObjLeft.rotateY(Math.PI / 2);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObjLeft);
    }
    snapObjLeft.visible = isVisible;
    snapObjs.push({
      obj: snapObjLeft,
      objType: 'floor',
      side: 'left'
    });
    
    const snapObjRight = new THREE.Mesh(objGeometry, mat);
    snapObjRight.position.copy(selectedObject.obj.position).add(snapPositions.right);
    snapObjRight.quaternion.copy(selectedObject.obj.quaternion);
    snapObjRight.rotateY(-Math.PI / 2);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObjRight);
    }
    snapObjRight.visible = isVisible;
    snapObjs.push({
      obj: snapObjRight,
      objType: 'floor',
      side: 'right'
    });
    
    const snapObjBack = new THREE.Mesh(objGeometry, matT);
    snapObjBack.position.copy(selectedObject.obj.position).add(snapPositions.back);
    snapObjBack.quaternion.copy(selectedObject.obj.quaternion);
    snapObjBack.rotateY(Math.PI);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObjBack);
    }
    snapObjBack.visible = isVisible;
    snapObjs.push({
      obj: snapObjBack,
      objType: 'floor',
      side: 'back'
    });
    
    const snapObjFront = new THREE.Mesh(objGeometry, matT);
    snapObjFront.position.copy(selectedObject.obj.position).add(snapPositions.front);
    snapObjFront.quaternion.copy(selectedObject.obj.quaternion);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObjFront);
    }
    snapObjFront.visible = isVisible;
    snapObjs.push({
      obj: snapObjFront,
      objType: 'floor',
      side: 'front'
    });
    
    return snapObjs;
  }
  
  if (selectedObject.objType === 'wall') {
    // Add snap point to wall object for roof connection
    const snapPos = new THREE.Vector3(0, 5, -0.1);
    const snapObj = new THREE.Mesh(objGeometry, mat);
    snapPos.applyQuaternion(selectedObject.obj.quaternion);
    snapObj.position.copy(selectedObject.obj.position).add(snapPos);
    snapObj.quaternion.copy(selectedObject.obj.quaternion);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObj);
    }
    snapObj.visible = isVisible;
    snapObjs.push({
      obj: snapObj,
      objType: 'wall',
    });
    
    return snapObjs;
  }
  
  if (selectedObject.objType === 'door') {
    // Add snap point to door object for roof connection (same as wall)
    const snapPos = new THREE.Vector3(0, 5, -0.1);
    const snapObj = new THREE.Mesh(objGeometry, mat);
    snapPos.applyQuaternion(selectedObject.obj.quaternion);
    snapObj.position.copy(selectedObject.obj.position).add(snapPos);
    snapObj.quaternion.copy(selectedObject.obj.quaternion);
    if (selectedObject.obj.parent) {
      selectedObject.obj.parent.add(snapObj);
    }
    snapObj.visible = isVisible;
    snapObjs.push({
      obj: snapObj,
      objType: 'door',
    });
    
    return snapObjs;
  }
  
  return snapObjs;
};

// Function to check for intersection between objects
const getIntersectObj = (object: SceneObject, snapRadius: THREE.Mesh): SceneObject | false => {
  const bounds = new THREE.Box3().setFromObject(object.obj);
  const radiusBounds = new THREE.Box3().setFromObject(snapRadius);
  const intersects = bounds.intersectsBox(radiusBounds);
  
  if (intersects) {
    return object;
  }
  
  return false;
};

// Function to set position of snapped objects
const setPosition = (objToSnap: SceneObject, selectedObject: SceneObject, snapRadius: THREE.Mesh): THREE.Vector3 | false => {
  let offset = 0;
  
  if (selectedObject.objType === 'wall' && selectedObject.obj instanceof THREE.Mesh && 
      selectedObject.obj.geometry instanceof THREE.BoxGeometry) {
    offset = selectedObject.obj.geometry.parameters.height / 2 + 0.5;
  } else if (selectedObject.objType === 'floor') {
    offset = -2;
  } else if (selectedObject.objType === 'roof') {
    offset = 0.1;
  } else if (selectedObject.objType === 'door') {
    // For doors, use 5 as a default height if we can't get it from geometry
    offset = 5.5;
  }
  
  // Get the direction of the snapped object
  const snappedDirection = new THREE.Vector3(0, 0, -1);
  snappedDirection.applyQuaternion(objToSnap.obj.quaternion);
  
  // Set the position of the selected object to the position of the snapped object
  selectedObject.obj.position.copy(objToSnap.obj.position);
  selectedObject.obj.position.y += offset;
  
  // Handle different object types and their snapping behavior
  if (selectedObject.objType === "floor") {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);
    
    // Move the selected object slightly away from the snapped object
    const direction = snappedDirection.clone().multiplyScalar(5);
    selectedObject.obj.position.add(direction);
  }
  
  if (selectedObject.objType === "wall") {
    // Apply the snapped direction to the selected object's quaternion
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);
    
    // Move the selected object slightly away from the snapped object
    const direction = snappedDirection.clone().multiplyScalar(-0.1);
    selectedObject.obj.position.add(direction);
    
    if (objToSnap.objType === "roof") {
      selectedObject.obj.position.y -= 1;
    }
    
    if (objToSnap.objType === "wall") {
      selectedObject.obj.position.y -= 0.5;
    }
  }
  
  if (selectedObject.objType === 'roof') {
    // Roof can only snap to walls or doors
    if (objToSnap.objType !== 'wall' && objToSnap.objType !== 'door') {
      return false;
    }
    
    const object1Position = objToSnap.obj.position.clone();
    const object1Orientation = new THREE.Vector3(0, 0, 1);
    const object2WorldPosition = new THREE.Vector3();
    snapRadius.getWorldPosition(object2WorldPosition);
    const vectorToObject2 = object2WorldPosition.clone().sub(object1Position);
    
    // Calculate the dot product of the orientation and vector to object2
    const dotProduct = object1Orientation.dot(vectorToObject2);
    
    // Apply the snapped direction to the selected object's quaternion
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);
    
    // Move the selected object away from the snapped object
    let direction;
    if (dotProduct < 0) {
      direction = snappedDirection.clone().multiplyScalar(4.8);
    } else {
      direction = snappedDirection.clone().multiplyScalar(-5);
    }
    
    // THIS IS THE FIX: Removing the check for objToSnap.objType === 'roof' 
    // since it's not possible at this point
    selectedObject.obj.position.add(direction);
  }
  
  if (selectedObject.objType === "door") {
    // Apply the same behavior as walls for doors
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);
    
    // Move the selected object slightly away from the snapped object
    const direction = snappedDirection.clone().multiplyScalar(-0.1);
    selectedObject.obj.position.add(direction);
    
    if (objToSnap.objType === "roof") {
      selectedObject.obj.position.y -= 1;
    }
    
    if (objToSnap.objType === "wall") {
      selectedObject.obj.position.y -= 0.5;
    }
    
    // If the door has a dummy mesh, update its position and rotation too
    if (selectedObject.obj.userData && selectedObject.obj.userData.dummyMesh) {
      selectedObject.obj.userData.dummyMesh.position.copy(selectedObject.obj.position);
      selectedObject.obj.userData.dummyMesh.quaternion.copy(selectedObject.obj.quaternion);
    }
  }
  
  return selectedObject.obj.position;
};

class GeoBuild extends Component<{}, GeoBuildState> {
  private selectedObject: SceneObject | null = null;
  private cubes: THREE.Object3D[] = [];
  private grid: any[] = [];
  private isDragging: boolean = false;
  private snapObjs: SceneObject[] = [];
  private objs: SceneObject[] = [];
  private objToSnap: SceneObject | null = null;
  private objHighlighted: any = null;
  private origMat: THREE.Material | null = null;
  private isStarted: boolean = false;
  private wIsDown: boolean = false;
  private eIsdown: boolean = false;
  private sIsDown: boolean = false;
  private aIsDown: boolean = false;
  private dIsDown: boolean = false;
  private spaceIsDown: boolean = false;
  private lControl: boolean = false;
  private inBound: boolean = false;
  private boundMat: THREE.Material | null = null;
  private time: Date = new Date();
  private lastTime: Date = new Date();
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private lockControls!: PointerLockControls;
  private renderer!: THREE.WebGLRenderer;
  private light!: THREE.PointLight;
  private geometry!: THREE.BoxGeometry;
  private material!: THREE.MeshBasicMaterial;
  private gridHelper!: THREE.GridHelper;
  private snapRadius!: THREE.Mesh;
  private dragControls!: DragControls;
  private mount: HTMLDivElement | null = null;
  private frameId: number = 0;
  private initialized: boolean = false;

  constructor(props: {}) {
    super(props);
    
    this.state = {
      mouseX: null,
      mouseY: null,
      isVisible: false,
      showInstructions: false
    };

    // Binding methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.animate = this.animate.bind(this);
    this.toggleInstructions = this.toggleInstructions.bind(this);
    this.toggleSnapPoints = this.toggleSnapPoints.bind(this);
    this.clearScene = this.clearScene.bind(this);
    this.initScene = this.initScene.bind(this);
  }

  initScene() {
    if (this.initialized || typeof window === 'undefined') return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.lockControls = new PointerLockControls(this.camera, document.body);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.light = new THREE.PointLight(0xffffff, 1, 100);
    this.light.position.set(0, 0, 10);
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: 0x8AAAE5 });
    this.gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888788);
    this.snapRadius = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 32), 
      this.material
    );
    
    this.scene.add(this.lockControls.getObject());
    this.snapRadius.position.set(0, 0, 0);
    this.scene.add(this.snapRadius);

    this.dragControls = new DragControls(
      this.cubes, 
      this.camera, 
      this.renderer.domElement
    );

    // Camera setup
    this.camera.position.y = 20;
    this.camera.position.z = 10;
    this.camera.rotation.x = -0.5;
    this.scene.add(this.light);
    this.scene.add(this.gridHelper);

    // Set up renderer
    this.renderer.setClearColor(0xFAF9F6);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.mount) {
      this.mount.appendChild(this.renderer.domElement);
    }

    // Set up event listeners
    this.dragControls.addEventListener('dragstart', (event) => {
      this.isDragging = true;
      const obj = event.object as THREE.Mesh;
      if (obj.material) {
        // Handle both single material and material array cases
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            if ('opacity' in mat) {
              mat.opacity = 0.33;
            }
          });
        } else if ('opacity' in obj.material) {
          obj.material.opacity = 0.33;
        }
      }
    });
    
    this.dragControls.addEventListener('dragend', (event) => {
      this.isDragging = false;
      const obj = event.object as THREE.Mesh;
      if (obj.material) {
        // Handle both single material and material array cases
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            if ('opacity' in mat) {
              mat.opacity = 1;
            }
          });
        } else if ('opacity' in obj.material) {
          obj.material.opacity = 1;
        }
      }
    });
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('keyup', this.handleKeyUp);

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Start animation
    this.animate();
    this.initialized = true;
  }

  componentDidMount() {
    // Necessary for both direct page load and client navigation
    this.initScene();
  }

  componentDidUpdate() {
    // Ensure initialization happens after client navigation
    if (!this.initialized) {
      this.initScene();
    }
  }

  componentWillUnmount() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    if (this.mount && this.renderer?.domElement) {
      this.mount.removeChild(this.renderer.domElement);
    }
    
    this.initialized = false;
  }

  handleMouseMove(event: MouseEvent) {
    if (this.selectedObject) {
      const deltaY = event.movementX * 0.002;
      this.selectedObject.obj.rotation.y -= deltaY;
      this.selectedObject.obj.rotation.z = 0;
      
      // If it's a door, update the dummy mesh rotation too
      if (this.selectedObject.objType === 'door' && 
          this.selectedObject.obj.userData && 
          this.selectedObject.obj.userData.dummyMesh) {
        this.selectedObject.obj.userData.dummyMesh.rotation.y = this.selectedObject.obj.rotation.y;
        this.selectedObject.obj.userData.dummyMesh.rotation.z = 0;
      }
    }
    
    if (this.objs && this.objs.length > 0 && !this.selectedObject) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Set the origin and direction of the raycaster
      raycaster.setFromCamera(mouse, this.camera);
      
      // Collect all objects and their children for intersection test
      const objsToTest: THREE.Object3D[] = [];
      this.objs.forEach(obj => {
        objsToTest.push(obj.obj);
        // Add children for testing too
        if (obj.obj.children && obj.obj.children.length > 0) {
          obj.obj.children.forEach(child => {
            if ((child as THREE.Mesh).isMesh) {
              objsToTest.push(child);
            }
          });
        }
      });
      
      const intersects = raycaster.intersectObjects(objsToTest, true);

      const basicMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true 
      });
      
      if (intersects.length > 0) {
        // If another object was previously highlighted, reset its material
        if (this.objHighlighted !== null) {
          const obj = this.objHighlighted.object as THREE.Mesh;
          if (obj.material && this.origMat) {
            obj.material = this.origMat;
          }
        }
        
        // Set the material of the intersected object to the basic material
        this.objHighlighted = intersects[0];
        const obj = this.objHighlighted.object as THREE.Mesh;
        if (obj.material) {
          this.origMat = obj.material as THREE.Material;
          obj.material = basicMaterial;
        }
      } else {
        // If there are no intersections, reset previously highlighted object
        if (this.objHighlighted !== null) {
          const obj = this.objHighlighted.object as THREE.Mesh;
          if (obj.material && this.origMat) {
            obj.material = this.origMat;
          }
          this.objHighlighted = null;
          this.origMat = null;
        }
      }
    }
  }

  // Helper method to remove the currently selected object
  removeSelectedObject() {
    if (!this.selectedObject) return;
    
    // Remove the object from the scene
    if (this.selectedObject.obj.parent) {
      this.scene.remove(this.selectedObject.obj.parent);
    }
    
    // Also remove any associated snap points
    for (let b = 0; b < this.snapObjs.length; b++) {
      if (this.snapObjs[b].obj.parent === this.selectedObject.obj.parent) {
        this.scene.remove(this.snapObjs[b].obj);
        this.snapObjs.splice(b, 1);
        b = b - 1;
      }
    }
    
    // Reset the selected object
    this.selectedObject = null;
    this.objToSnap = null;
  }

  handleMouseDown() {
    if (!this.eIsdown) {
      if (!this.inBound) {
        if (this.selectedObject) {
          // Don't place the object if not in a valid position
          this.removeSelectedObject();
        }
      } else {
        if (this.selectedObject) {
          // Add object to the objs array now that it's being placed
          this.objs.push({
            obj: this.selectedObject.obj,
            objType: this.selectedObject.objType,
          });
          
          // Add snap points when placing an object
          const newSnaps = addSnaps(this.selectedObject, this.state.isVisible);
          if (newSnaps) {
            newSnaps.forEach((obj) => {
              this.snapObjs.push(obj);
            });
          }
          
          this.selectedObject = null;
          this.objToSnap = null;
        }
      }
    }
    
    if (this.eIsdown) {
      if (this.selectedObject) {
        // Remove the selected object when clicking in the object menu
        this.removeSelectedObject();
      }
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 69) { // E key
      this.eIsdown = true;
      const popup = document.getElementById("geo-popup");
      if (popup) popup.style.display = "block";
      this.lockControls.unlock();
    }

    if (event.keyCode === 87) { // W key
      this.wIsDown = true;
    }
    
    if (event.keyCode === 82) { // R key
      if (this.objHighlighted) {
        // Find the object in our objs array
        let objToRemove: SceneObject | null = null;
        let objIndex = -1;
        
        for (let i = 0; i < this.objs.length; i++) {
          // Check if the highlighted object is either the object itself or a child or parent
          const isMatch = 
            this.objs[i].obj === this.objHighlighted.object || 
            this.objs[i].obj.parent === this.objHighlighted.object.parent ||
            this.objHighlighted.object.parent === this.objs[i].obj;
          
          if (isMatch) {
            objToRemove = this.objs[i];
            objIndex = i;
            break;
          }
        }
        
        if (objToRemove && objToRemove.obj.parent) {
          // Remove the object and its parent
          this.scene.remove(objToRemove.obj.parent);
          
          // Remove from objs array
          if (objIndex > -1) {
            this.objs.splice(objIndex, 1);
          }
          
          // Remove associated snap points
          for (let j = 0; j < this.snapObjs.length; j++) {
            if (this.snapObjs[j].obj && this.snapObjs[j].obj.parent === objToRemove.obj.parent) {
              this.scene.remove(this.snapObjs[j].obj);
              this.snapObjs.splice(j, 1);
              j = j - 1;
            }
          }
        }
        
        this.objHighlighted = null;
        this.origMat = null;
      }
    }
    
    if (event.keyCode === 83) { // S key
      this.sIsDown = true;
    }
    
    if (event.keyCode === 65) { // A key
      this.aIsDown = true;
    }
    
    if (event.keyCode === 68) { // D key
      this.dIsDown = true;
    }
    
    if (event.key === " ") { // Space key
      this.spaceIsDown = true;
    }
    
    if (event.keyCode === 88) { // X key
      this.lControl = true;
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 69) { // E key
      const popup = document.getElementById("geo-popup");
      if (popup) popup.style.display = "none";
      this.eIsdown = false;
      this.lockControls.lock();
    }
    
    if (event.keyCode === 87) { // W key
      this.wIsDown = false;
    }
    
    if (event.keyCode === 83) { // S key
      this.sIsDown = false;
    }
    
    if (event.keyCode === 65) { // A key
      this.aIsDown = false;
    }
    
    if (event.keyCode === 68) { // D key
      this.dIsDown = false;
    }
    
    if (event.keyCode === 32) { // Space key
      this.spaceIsDown = false;
    }
    
    if (event.keyCode === 88) { // X key
      this.lControl = false;
    }
  }

  animate() {
    if (!this.initialized) {
      this.frameId = window.requestAnimationFrame(this.animate);
      return;
    }
    
    this.time = new Date();
    const deltaTime = this.time.getTime() - this.lastTime.getTime();
    this.lastTime = this.time;

    if (this.selectedObject) {
      const v = this.camera.getWorldPosition(new THREE.Vector3());
      v.addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), 13);
      this.snapRadius.position.set(v.x, v.y - 10, v.z);
      
      if (this.snapObjs.length === 0) {
        const v = this.camera.getWorldPosition(new THREE.Vector3());
        v.addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), 13);
        this.selectedObject.obj.position.set(v.x, v.y - 10, v.z);
        
        // Update position of dummy mesh for doors
        if (this.selectedObject.objType === 'door' && 
            this.selectedObject.obj.userData && 
            this.selectedObject.obj.userData.dummyMesh) {
          this.selectedObject.obj.userData.dummyMesh.position.copy(this.selectedObject.obj.position);
        }
      } else {
        // Check for snap points intersection
        let snapped = false;
        
        for (let i = 0; i < this.snapObjs.length; i++) {
          this.objToSnap = null;
          const intersectedObj = getIntersectObj(this.snapObjs[i], this.snapRadius);
          
          if (intersectedObj) {
            // Special check for roof - can only snap to wall or door
            if (this.selectedObject.objType === 'roof' && 
               (intersectedObj.objType !== 'wall' && intersectedObj.objType !== 'door')) {
              continue;
            }
            
            // Special check for door - can only snap to floor like walls do
            if (this.selectedObject.objType === 'door' && 
               intersectedObj.objType !== 'floor') {
              continue;
            }
            
            this.objToSnap = intersectedObj;
            
            // Set position based on intersection
            const snapPosition = setPosition(intersectedObj, this.selectedObject, this.snapRadius);
            if (snapPosition) {
              this.selectedObject.obj.position.copy(snapPosition);
              
              // Update position of dummy mesh for doors
              if (this.selectedObject.objType === 'door' && 
                  this.selectedObject.obj.userData && 
                  this.selectedObject.obj.userData.dummyMesh) {
                this.selectedObject.obj.userData.dummyMesh.position.copy(snapPosition);
              }
              
              snapped = true;
              break;
            }
          }
        }
        
        // If not snapped to any object, keep at camera position
        if (!snapped) {
          const v = this.camera.getWorldPosition(new THREE.Vector3());
          v.addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), 13);
          this.selectedObject.obj.position.set(v.x, v.y - 10, v.z);
          
          // Update position of dummy mesh for doors
          if (this.selectedObject.objType === 'door' && 
              this.selectedObject.obj.userData && 
              this.selectedObject.obj.userData.dummyMesh) {
            this.selectedObject.obj.userData.dummyMesh.position.copy(this.selectedObject.obj.position);
          }
        }
      }
      
      this.snapRadius.visible = true;
    }
    
    if (this.selectedObject) {
      if (this.selectedObject.objType === 'floor' || 
          this.selectedObject.objType === 'wall' || 
          this.selectedObject.objType === 'door' ||
          this.selectedObject.objType === 'roof') {
        if (this.boundMat === null) {
          // Store the original material
          const mesh = this.selectedObject.obj as THREE.Mesh;
          if (mesh.material) {
            this.boundMat = (mesh.material as THREE.Material).clone();
          }
        }
      }
      
      // Check if object is in valid position
      const mesh = this.selectedObject.obj as THREE.Mesh;
      
      if ((this.selectedObject.objType === 'floor') && 
          (this.selectedObject.obj.position.y < -5 || this.selectedObject.obj.position.y > 5)) {
        mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.inBound = false;
      } else if (this.selectedObject.objType === 'roof' && !this.objToSnap) {
        // Roof can only be placed on walls or doors
        mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.inBound = false;
      } else if ((this.selectedObject.objType === 'wall' || this.selectedObject.objType === 'door') && 
        !this.objToSnap) {
        mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.inBound = false;
      } else {
        this.inBound = true;
        if (this.boundMat) {
          // Restore original material
          mesh.material = this.boundMat;
          this.boundMat = null;
        }
      }
    }

    if (!this.isDragging) {
      this.snapRadius.visible = false;
    }

    // Handle camera movement
    if (this.wIsDown) {
      this.camera.position.addScaledVector(
        this.camera.getWorldDirection(new THREE.Vector3()), 
        0.01 * deltaTime
      );
    }

    if (this.sIsDown) {
      this.camera.position.addScaledVector(
        this.camera.getWorldDirection(new THREE.Vector3()), 
        -0.01 * deltaTime
      );
    }

    if (this.aIsDown) {
      this.camera.translateX(-0.01 * deltaTime);
    }

    if (this.dIsDown) {
      this.camera.translateX(0.01 * deltaTime);
    }

    if (this.spaceIsDown) {
      this.camera.translateY(0.01 * deltaTime);
    }

    if (this.lControl) {
      this.camera.translateY(-0.01 * deltaTime);
    }

    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  renderScene() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  addObj(objType: ObjectType) {
    const vThree = new THREE.Vector3(
      this.camera.position.x, 
      this.camera.position.y, 
      this.camera.position.z
    );

    // Move the object in front of the camera
    vThree.addScaledVector(this.camera.getWorldDirection(new THREE.Vector3()), 20);

    // If an object is currently selected, remove it without placing it
    if (this.selectedObject) {
      this.removeSelectedObject();
    }

    const obj = objIns(vThree, objType);
    if (!obj) return;
    
    // Set the selectedObject based on objType
    // For door objects, we need special handling
    if (objType === 'door') {
      // Find the main mesh in the object's children
      const doorMesh = obj.children[0]; // First child should be our door mesh
      
      this.selectedObject = {
        obj: doorMesh,
        objType: objType,
      };
    } else {
      this.selectedObject = {
        obj: obj.children[0],
        objType: objType,
      };
    }

    // Only add to scene, don't add to objs array until placed
    this.scene.add(obj);
  }
  
  // Method to clear the entire scene
  clearScene() {
    // Remove all objects
    for (let i = this.objs.length - 1; i >= 0; i--) {
      if (this.objs[i].obj.parent) {
        this.scene.remove(this.objs[i].obj.parent!);
      }
    }
    
    // Remove all snap points
    for (let i = this.snapObjs.length - 1; i >= 0; i--) {
      if (this.snapObjs[i].obj.parent) {
        this.scene.remove(this.snapObjs[i].obj.parent!);
      }
    }
    
    // Clear arrays
    this.objs = [];
    this.snapObjs = [];
    
    // Reset other properties
    this.selectedObject = null;
    this.objToSnap = null;
    this.objHighlighted = null;
    this.origMat = null;
    this.boundMat = null;
  }

  toggleInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }

  toggleSnapPoints() {
    const isVisible = !this.state.isVisible;
    this.setState({ isVisible });

    this.snapObjs.forEach((obj) => {
      if (obj.obj) {
        obj.obj.visible = isVisible;
      }
    });
  }

  render() {
    return (
      <div style={{ position: 'relative', width: '90%', height: '100vh', overflow: 'hidden', marginLeft: '200px', marginTop:'-10px' }}>
        
        <div
          ref={(mount) => {
            this.mount = mount;
          }}
          style={{ width: '100%', height: '100%' }}
        />

        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 100
        }}>
          <div 
            onClick={this.toggleInstructions}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            Instructions ↓
          </div>

          <div 
            onClick={this.toggleSnapPoints}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            {this.state.isVisible ? 'Hide' : 'Show'} snap points
          </div>

          <div 
            onClick={this.clearScene}
            style={{ 
              cursor: 'pointer',
              backgroundColor: '#FF5252',
              color: 'white',
              padding: '5px 10px',
              textAlign: 'center',
              borderRadius: '4px'
            }}
          >
            Clear Scene
          </div>
        </div>

        {this.state.showInstructions && (
          <div style={{
            position: 'fixed',
            top: '50px',
            right: '10px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0 }}>Movement</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>To move use WASD keys</li>
              <li>Hold spacebar to move up</li>
              <li>Hold X to move down</li>
              <li>Look around with mouse</li>
            </ul>

            <h3>Building Objects</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Hold E to show object menu</li>
              <li>Click on object name to add it to scene</li>
              <li>After selecting object, it will move with your camera until placed</li>
              <li>Click to place the object</li>
              <li>Red objects cannot be placed - make sure they're in a valid position</li>
              <li>Walls must snap to floors</li>
              <li>Doors must snap to floors (same as walls)</li>
              <li>Roofs can only snap to walls or doors</li>
              <li>Selecting a new object will cancel placement of current object</li>
            </ul>

            <h3>Removing Objects</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Look at any object until it becomes wireframe</li>
              <li>Press 'R' key to remove it</li>
            </ul>
          </div>
        )}

        <div 
          id="geo-popup"
          style={{
            position: 'fixed',
            height: 'auto',
            width: '250px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            border: '1px solid black',
            padding: '15px',
            display: 'none',
            zIndex: 100,
            borderRadius: '8px',
            boxShadow: '0px 0px 15px rgba(0,0,0,0.3)'
          }}
        >
          <h3 style={{ textAlign: 'center', marginTop: 0 }}>Select an Object</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li 
              onClick={() => this.addObj("wall")}
              style={{ 
                cursor: 'pointer', 
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#0539CFF',
                marginRight: '10px',
                border: '1px solid black'
              }}></div>
              <span>Wall</span>
            </li>
            <li 
              onClick={() => this.addObj("floor")}
              style={{ 
                cursor: 'pointer', 
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#EEA47F',
                marginRight: '10px',
                border: '1px solid black'
              }}></div>
              <span>Floor</span>
            </li>
            <li 
              onClick={() => this.addObj("roof")}
              style={{ 
                cursor: 'pointer', 
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#317773',
                marginRight: '10px',
                border: '1px solid black'
              }}></div>
              <span>Roof</span>
            </li>
            <li 
              onClick={() => this.addObj("door")}
              style={{ 
                cursor: 'pointer', 
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#CC313D',
                marginRight: '10px',
                border: '1px solid black'
              }}></div>
              <span>Door</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default GeoBuild;