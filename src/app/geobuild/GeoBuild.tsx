'use client';

import React, { Component, RefObject } from 'react';
import * as THREE from 'three';

import { GeoBuildState, ObjectType, SceneObject, ThreeContext } from './types';
import { objIns } from './objectFactory';
import { addSnaps, getIntersectObj, setPosition } from './snapping';
import { initializeThreeScene } from './threeSetup';

interface GeoBuildComponentState extends GeoBuildState {
  isRemovalMode: boolean;
}

class GeoBuild extends Component<{}, GeoBuildComponentState> {
  private mountRef: RefObject<HTMLDivElement>;
  private threeContext: (ThreeContext & { cleanup: () => void }) | null = null;

  private frameId: number = 0;
  private initialized: boolean = false;
  private selectedObject: SceneObject | null = null;
  private objs: SceneObject[] = [];
  private snapObjs: SceneObject[] = [];
  private objToSnap: SceneObject | null = null;
  private objHighlighted: THREE.Intersection | null = null;
  private origMat: THREE.Material | THREE.Material[] | null = null;
  private boundMat: THREE.Material | THREE.Material[] | null = null;

  private isDraggingObject: boolean = false;
  private wIsDown: boolean = false;
  private sIsDown: boolean = false;
  private aIsDown: boolean = false;
  private dIsDown: boolean = false;
  private spaceIsDown: boolean = false;
  private xIsDown: boolean = false;
  private eIsDown: boolean = false;
  private isPointerLocked: boolean = false;
  private inPlacementBounds: boolean = true;

  private lastTime: number = Date.now();

  constructor(props: {}) {
    super(props);
    this.mountRef = React.createRef();

    this.state = {
      mouseX: null,
      mouseY: null,
      isVisible: false,
      showInstructions: true,
      isRemovalMode: false,
    };

    this.init = this.init.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.animate = this.animate.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.addObj = this.addObj.bind(this);
    this.placeSelectedObject = this.placeSelectedObject.bind(this);
    this.removeSelectedObject = this.removeSelectedObject.bind(this);
    this.removeHighlightedObject = this.removeHighlightedObject.bind(this);
    this.resetHighlight = this.resetHighlight.bind(this);
    this.clearScene = this.clearScene.bind(this);
    this.toggleInstructions = this.toggleInstructions.bind(this);
    this.toggleSnapPoints = this.toggleSnapPoints.bind(this);
  }


  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this.cleanup();
  }


  init() {
    if (this.initialized || typeof window === 'undefined' || !this.mountRef.current) return;

    const dragHandlers = {
      onDragStart: (event: THREE.Event) => {
        this.isDraggingObject = true;
        if (this.threeContext) this.threeContext.pointerLockControls.unlock();
      },
      onDragEnd: (event: THREE.Event) => {
        this.isDraggingObject = false;
        if (!this.eIsDown && !this.state.isRemovalMode && this.threeContext && !this.isPointerLocked) {
          this.threeContext.pointerLockControls.lock();
        }
      }
    };

    this.threeContext = initializeThreeScene(
      this.mountRef.current,
      [],
      dragHandlers
    );

    this.mountRef.current.addEventListener('mousedown', this.handleMouseDown);
    this.mountRef.current.addEventListener('contextmenu', this.handleContextMenu);

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);

    this.threeContext.pointerLockControls.addEventListener('lock', () => {
      this.isPointerLocked = true;
      const popup = document.getElementById("geo-popup");
      if (popup) popup.style.display = "none";
      this.eIsDown = false;
      if (this.state.isRemovalMode) {
        this.setState({ isRemovalMode: false });
        this.resetHighlight();
        document.body.style.cursor = 'default';
      }
    });
    this.threeContext.pointerLockControls.addEventListener('unlock', () => {
      this.isPointerLocked = false;
    });

    this.initialized = true;
    this.lastTime = Date.now();
    this.animate();
  }

  cleanup() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    if (this.mountRef.current) {
      this.mountRef.current.removeEventListener('mousedown', this.handleMouseDown);
      this.mountRef.current.removeEventListener('contextmenu', this.handleContextMenu);
    }

    this.threeContext?.cleanup();
    document.body.style.cursor = 'default';

    this.initialized = false;
    this.objs = [];
    this.snapObjs = [];
    this.selectedObject = null;
    this.objToSnap = null;
    this.objHighlighted = null;
    this.setState({ isRemovalMode: false });
  }


  handleKeyDown(event: KeyboardEvent) {
    if (!this.threeContext) return;

    switch (event.code) {
      case 'KeyE':
        if (this.state.isRemovalMode) return;

        if (this.selectedObject) {
           this.removeSelectedObject(false);
        }

        this.eIsDown = true;
        this.threeContext.pointerLockControls.unlock();
        const popup = document.getElementById("geo-popup");
        if (popup) popup.style.display = "block";
        break;

      case 'KeyR':
        const enteringRemoval = !this.state.isRemovalMode;
        this.setState({ isRemovalMode: enteringRemoval });

        if (enteringRemoval) {
          if (this.selectedObject) this.removeSelectedObject(false);
          if (this.eIsDown) {
              const popupE = document.getElementById("geo-popup");
              if (popupE) popupE.style.display = "none";
              this.eIsDown = false;
          }
          this.threeContext.pointerLockControls.unlock();
          this.resetHighlight();
          document.body.style.cursor = 'crosshair';
        } else {
          this.resetHighlight();
          document.body.style.cursor = 'default';
        }
        break;

      case 'Escape':
        if (this.state.isRemovalMode) {
          this.setState({ isRemovalMode: false });
          this.resetHighlight();
          document.body.style.cursor = 'default';
        } else if (this.selectedObject) {
          this.removeSelectedObject(false);
          if (!this.isPointerLocked) this.threeContext.pointerLockControls.lock();
        } else if (this.eIsDown) {
          const popupEsc = document.getElementById("geo-popup");
          if (popupEsc) popupEsc.style.display = "none";
          this.eIsDown = false;
          if (!this.isPointerLocked) this.threeContext.pointerLockControls.lock();
        } else if (this.isPointerLocked) {
          this.threeContext.pointerLockControls.unlock();
        }
        break;

      case 'KeyW': this.wIsDown = true; break;
      case 'KeyS': this.sIsDown = true; break;
      case 'KeyA': this.aIsDown = true; break;
      case 'KeyD': this.dIsDown = true; break;
      case 'Space': this.spaceIsDown = true; break;
      case 'KeyX': this.xIsDown = true; break;
    }
  }

  handleKeyUp(event: KeyboardEvent) {
    if (!this.threeContext) return;

    switch (event.code) {
      case 'KeyE':
        const popup = document.getElementById("geo-popup");
        if (!popup || popup.style.display === 'none') {
            this.eIsDown = false;
        }
        break;
      case 'KeyW': this.wIsDown = false; break;
      case 'KeyS': this.sIsDown = false; break;
      case 'KeyA': this.aIsDown = false; break;
      case 'KeyD': this.dIsDown = false; break;
      case 'Space': this.spaceIsDown = false; break;
      case 'KeyX': this.xIsDown = false; break;
    }
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.threeContext) return;

    if (this.isPointerLocked && this.selectedObject && !this.state.isRemovalMode && !this.eIsDown) {
      const movementX = event.movementX || 0;
      const rotateSpeed = 0.003;
      this.selectedObject.obj.rotation.y -= movementX * rotateSpeed;
      this.selectedObject.obj.rotation.x = 0;
      this.selectedObject.obj.rotation.z = 0;
      if (this.selectedObject.objType === 'door' && this.selectedObject.obj.userData.dummyMesh) {
        this.selectedObject.obj.userData.dummyMesh.quaternion.copy(this.selectedObject.obj.quaternion);
      }
    }

    if (this.state.isRemovalMode && !this.isPointerLocked && this.objs.length > 0) {
      this.highlightObjectOnHover(event);
    } else if (this.objHighlighted) {
      this.resetHighlight();
    }
  }

  handleMouseDown(event: MouseEvent) {
    if (!this.threeContext) return;

    if (event.button === 2) {
        return;
    }

    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('#geo-popup') || target.closest('.button-container')) {
      return;
    }

    if (this.state.isRemovalMode) {
      if (this.objHighlighted) {
        this.removeHighlightedObject();
      }
      return;
    }

    if (this.eIsDown) {
      const popup = document.getElementById("geo-popup");
      if (popup && !popup.contains(event.target as Node)) {
        popup.style.display = "none";
        this.eIsDown = false;
        if (!this.isPointerLocked) this.threeContext.pointerLockControls.lock();
      }
      return;
    }

    if (!this.isPointerLocked) {
      this.threeContext.pointerLockControls.lock();
    } else {
      if (this.selectedObject) {
        if (this.inPlacementBounds) {
          this.placeSelectedObject();
        } else {
          console.warn("Cannot place object: Invalid position.");
        }
      }
    }
  }

  handleContextMenu(event: MouseEvent) {
    if (!this.threeContext) return;

    event.preventDefault();

    if (this.selectedObject) {
        this.removeSelectedObject(false);

    }
  }


  animate() {
    if (!this.initialized || !this.threeContext) {
      if(this.frameId) cancelAnimationFrame(this.frameId);
      return;
    }

    this.frameId = requestAnimationFrame(this.animate);

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.isPointerLocked) {
      this.updateCameraMovement(deltaTime);
    }

    if (this.selectedObject) {
        this.updateSelectedObjectPosition();
        this.checkPlacementBounds();
    } else {
        if(this.threeContext?.snapRadius) this.threeContext.snapRadius.visible = false;
    }

    this.threeContext.renderer.render(this.threeContext.scene, this.threeContext.camera);
  }

  updateCameraMovement(deltaTime: number) {
    const moveSpeed = 0.01;
    const actualMoveSpeed = moveSpeed * deltaTime;
    const controls = this.threeContext!.pointerLockControls;

    if (this.wIsDown) controls.moveForward(actualMoveSpeed);
    if (this.sIsDown) controls.moveForward(-actualMoveSpeed);
    if (this.aIsDown) controls.moveRight(-actualMoveSpeed);
    if (this.dIsDown) controls.moveRight(actualMoveSpeed);

    const verticalSpeed = moveSpeed * deltaTime;
    if (this.spaceIsDown) this.threeContext!.camera.position.y += verticalSpeed;
    if (this.xIsDown) this.threeContext!.camera.position.y -= verticalSpeed;
  }


  updateSelectedObjectPosition() {
    const { camera, snapRadius } = this.threeContext!;
    const placementDistance = 15;

    const camDirection = camera.getWorldDirection(new THREE.Vector3());
    const camPosition = camera.getWorldPosition(new THREE.Vector3());
    const radiusPosition = camPosition.clone().addScaledVector(camDirection, placementDistance);
    snapRadius.position.copy(radiusPosition);
    snapRadius.visible = true;

    let snapped = false;
    this.objToSnap = null;

    for (const potentialSnapTarget of this.snapObjs) {
        const intersectedSnapPoint = getIntersectObj(potentialSnapTarget, snapRadius);
        if (intersectedSnapPoint) {
            let canSnap = false;
            const placingType = this.selectedObject!.objType;
            const targetType = intersectedSnapPoint.objType;

            if (placingType === 'floor') canSnap = true;
            else if (placingType === 'wall' || placingType === 'door') canSnap = (targetType === 'floor');
            else if (placingType === 'roof') canSnap = (targetType === 'wall' || targetType === 'door');

            if (canSnap) {
                const snapPositionResult = setPosition(intersectedSnapPoint, this.selectedObject!, snapRadius);
                if (snapPositionResult) {
                    this.objToSnap = intersectedSnapPoint;
                    snapped = true;
                    break;
                }
            }
        }
    }

    if (!snapped) {
      const targetPos = camPosition.clone().addScaledVector(camDirection, placementDistance);
      targetPos.y = Math.max(targetPos.y - 2, 0);
      this.selectedObject!.obj.position.copy(targetPos);

      if (this.selectedObject!.objType === 'door' && this.selectedObject!.obj.userData.dummyMesh) {
          this.selectedObject!.obj.userData.dummyMesh.position.copy(targetPos);
          this.selectedObject!.obj.userData.dummyMesh.quaternion.copy(this.selectedObject!.obj.quaternion);
      }
    }
  }

  checkPlacementBounds() {
      if (!this.selectedObject!.obj) return;

      let isValid = true;
      const errorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false, transparent: true, opacity: 0.7 });

       const placingType = this.selectedObject!.objType;
      const targetType = this.objToSnap?.objType;

      if (placingType !== 'floor' && !this.objToSnap) {
          isValid = false;
      } else if ((placingType === 'wall' || placingType === 'door') && targetType !== 'floor') {
          isValid = false;
      } else if (placingType === 'roof' && targetType !== 'wall' && targetType !== 'door') {
          isValid = false;
      }

      const mesh = this.selectedObject!.obj as THREE.Mesh;
      if (!isValid) {
          if (!this.boundMat) {
              if (mesh.material !== errorMaterial) {
                  this.boundMat = mesh.material;
              }
          }
           if (mesh.material !== errorMaterial) {
                mesh.material = errorMaterial;
           }
          this.inPlacementBounds = false;
      } else {
          if (this.boundMat) {
              mesh.material = this.boundMat;
              this.boundMat = null;
          }
          this.inPlacementBounds = true;
      }
  }


  highlightObjectOnHover(event: MouseEvent) {
      if (this.objs.length === 0) return;

      const { camera } = this.threeContext!;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      const parentsToCheck = this.objs.map(o => o.obj.parent).filter(p => p instanceof THREE.Object3D) as THREE.Object3D[];
      const intersects = raycaster.intersectObjects(parentsToCheck, true);

      const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });

      let foundHighlightable = false;
      if (intersects.length > 0) {
          const firstIntersected = intersects[0];
          if (firstIntersected.object instanceof THREE.Mesh && !this.isSnapPoint(firstIntersected.object)) {
               if (this.objHighlighted?.object !== firstIntersected.object) {
                   this.resetHighlight();
                   this.objHighlighted = firstIntersected;
                   this.origMat = firstIntersected.object.material;
                   firstIntersected.object.material = highlightMaterial;
               }
               foundHighlightable = true;
           }
      }

      if (!foundHighlightable && this.objHighlighted) {
          this.resetHighlight();
      }
  }

  isSnapPoint(object: THREE.Object3D): boolean {
      return this.snapObjs.some(snap => snap.obj === object);
  }

  resetHighlight() {
    if (this.objHighlighted && this.origMat) {
      const highlightedMesh = this.objHighlighted.object as THREE.Mesh;
      if (highlightedMesh && highlightedMesh.material !== this.origMat) {
         highlightedMesh.material = this.origMat;
      }
    }
    this.objHighlighted = null;
    this.origMat = null;
  }

  removeHighlightedObject() {
    const objectToRemove = this.objHighlighted!.object;
    let parentToRemove: THREE.Object3D | null = null;
    let sceneObjIndex = -1;

    for (let i = 0; i < this.objs.length; i++) {
      const sceneObjParent = this.objs[i].obj.parent;
      if (sceneObjParent && objectToRemove.parent === sceneObjParent) {
          parentToRemove = sceneObjParent;
          sceneObjIndex = i;
          break;
      }
    }

    if (parentToRemove && sceneObjIndex !== -1) {
      const snapsToRemoveIndices: number[] = [];
      this.snapObjs.forEach((snap, index) => {
        if (snap.obj.parent === parentToRemove) {
          snapsToRemoveIndices.push(index);
        }
      });
      for (let i = snapsToRemoveIndices.length - 1; i >= 0; i--) {
        const snapToRemove = this.snapObjs[snapsToRemoveIndices[i]];
        this.snapObjs.splice(snapsToRemoveIndices[i], 1);
      }

      if (parentToRemove.parent === this.threeContext!.scene) {
          this.threeContext!.scene.remove(parentToRemove);
      } else {
          console.warn("Could not remove object, parent not found directly in scene.");
      }

      this.objs.splice(sceneObjIndex, 1);

      this.resetHighlight();

    } else {
      console.warn("Failed to find tracked object parent for removal.");
      this.resetHighlight();
    }
  }


  addObj(objType: ObjectType) {
    if (!this.threeContext) return;

    const popup = document.getElementById("geo-popup");
    if (popup) popup.style.display = "none";
    this.eIsDown = false;
    if (!this.isPointerLocked) {
        this.threeContext.pointerLockControls.lock();
    }

    if (this.selectedObject) {
      this.removeSelectedObject(false);
    }

    const initialPos = new THREE.Vector3();
    this.threeContext.camera.getWorldPosition(initialPos);
    initialPos.addScaledVector(this.threeContext.camera.getWorldDirection(new THREE.Vector3()), 15);

    const parentObj = objIns(initialPos, objType);
    if (!parentObj || parentObj.children.length === 0) {
      console.error("Failed to create object instance:", objType);
      return;
    }

    const mainChild = parentObj.children[0];
    if (!mainChild) {
         console.error("Object instance created without a main child mesh:", objType);
         return;
    }

    this.selectedObject = {
      obj: mainChild,
      objType: objType,
    };

    this.threeContext.scene.add(parentObj);

    this.objToSnap = null;
    this.inPlacementBounds = false;
    this.boundMat = null;
  }

  placeSelectedObject() {
    if (!this.selectedObject || !this.threeContext) return;

    this.objs.push({
      obj: this.selectedObject.obj,
      objType: this.selectedObject.objType,
    });

    const newSnaps = addSnaps(this.selectedObject, this.state.isVisible);
    this.snapObjs.push(...newSnaps);

    this.selectedObject = null;
    this.objToSnap = null;
    this.inPlacementBounds = true;
    this.boundMat = null;
    this.threeContext.snapRadius.visible = false;
  }

  removeSelectedObject(createSnaps: boolean = false) {
    if (!this.selectedObject || !this.threeContext) return;

    if (this.selectedObject.obj.parent) {
      this.threeContext.scene.remove(this.selectedObject.obj.parent);
    }

    this.selectedObject = null;
    this.objToSnap = null;
    this.inPlacementBounds = true;
    this.boundMat = null;
    if (this.threeContext?.snapRadius) this.threeContext.snapRadius.visible = false;
  }


  clearScene() {
    if (!this.threeContext) return;

    this.objs.forEach(sceneObj => {
      if (sceneObj.obj.parent && sceneObj.obj.parent.parent === this.threeContext?.scene) {
        this.threeContext?.scene.remove(sceneObj.obj.parent);
      }
    });

    this.objs = [];
    this.snapObjs = [];

    if (this.selectedObject) {
      this.removeSelectedObject(false);
    }
    this.resetHighlight();
    this.setState({ isRemovalMode: false });
    document.body.style.cursor = 'default';
  }


  toggleInstructions() {
    this.setState(prevState => ({ showInstructions: !prevState.showInstructions }));
  }

  toggleSnapPoints() {
    const newVisibility = !this.state.isVisible;
    this.setState({ isVisible: newVisibility });
    this.snapObjs.forEach(snap => {
      if (snap.obj) snap.obj.visible = newVisibility;
    });
  }


  render() {
    return (
      <div style={rootStyle}>
        <div ref={this.mountRef}
          className="geobuild-canvas-container"
          style={canvasContainerStyle}
        />

        {this.state.isRemovalMode && (
          <div style={removalIndicatorStyle}>
            REMOVAL MODE (Click to Delete)
          </div>
        )}

        <div style={buttonContainerStyle} className="button-container">
          <button onClick={this.toggleInstructions} style={buttonStyle} title="Show/Hide Help">
            Help {this.state.showInstructions ? '▲' : '▼'}
          </button>
          <button onClick={this.toggleSnapPoints} style={buttonStyle} title="Show/Hide Placement Snap Points">
            {this.state.isVisible ? 'Hide Snaps' : 'Show Snaps'}
          </button>
          <button
            onClick={() => this.handleKeyDown({ code: 'KeyR' } as KeyboardEvent)}
            style={{ ...buttonStyle, backgroundColor: this.state.isRemovalMode ? '#FFEB3B' : '#f8f8f8' }}
            title="Toggle Removal Mode (R key)"
          >
            {this.state.isRemovalMode ? 'Exit Remove' : 'Remove Obj'}
          </button>
          <button onClick={this.clearScene} style={clearButtonStyle} title="Remove all objects">
            Clear All
          </button>
        </div>

        {this.state.showInstructions && (
          <div style={instructionsPanelStyle}>
            <h3 style={sectionHeaderStyle}>Movement</h3>
            <ul style={listStyle}>
              <li>Move: <code style={codeStyle}>W A S D</code></li>
              <li>Up/Down: <code style={codeStyle}>Space</code> / <code style={codeStyle}>X</code></li>
              <li>Look: Mouse (Click to Lock Cursor)</li>
               <li>Exit Modes/Cancel: <code style={codeStyle}>Escape</code></li>
            </ul>
             <h3 style={sectionHeaderStyle}>Building</h3>
            <ul style={listStyle}>
              <li>Open Menu: Press <code style={codeStyle}>E</code> (Cancels current placement)</li>
              <li>Select Object: Click name in menu</li>
              <li>Rotate Selected: Move mouse (while placing)</li>
              <li>Place Object: Left Mouse Click</li>
              <li>Cancel Placement: Right Mouse Click or <code style={codeStyle}>Esc</code></li>
              <li><span style={{color:'red', fontWeight:'bold'}}>Red Object:</span> Invalid placement</li>
               <li>Walls/Doors must snap to Floors</li>
               <li>Roofs must snap to Walls/Doors</li>
            </ul>
            <h3 style={sectionHeaderStyle}>Removing Objects</h3>
            <ul style={listStyle}>
                <li>Press <code style={codeStyle}>R</code> to enter/exit Removal Mode.</li>
                <li>Mouse unlocks, cursor is a crosshair.</li>
                <li>Hover over object to highlight (yellow).</li>
                <li>Left Click highlighted object to remove.</li>
            </ul>
          </div>
        )}

        <div id="geo-popup" style={popupStyle}>
          <h3 style={popupHeaderStyle}>Select Object (Press E)</h3>
          <ul style={popupListStyle}>
            {objectMenuItems.map(item => (
              <li
                key={item.type}
                onClick={() => this.addObj(item.type)}
                style={popupItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              >
                <div style={{ ...popupColorPreviewStyle, backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}


const objectColors = {
  floor: '#EEA47F',
  wall: '#5DADE2',
  roof: '#AF601A',
  door: '#CD6155'
};

const objectMenuItems: { label: string, type: ObjectType, color: string }[] = [
    { label: 'Floor', type: 'floor', color: objectColors.floor },
    { label: 'Wall', type: 'wall', color: objectColors.wall },
    { label: 'Door', type: 'door', color: objectColors.door },
    { label: 'Roof', type: 'roof', color: objectColors.roof },
];


const rootStyle: React.CSSProperties = {
    position: 'fixed',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    top: 0,
    left: 0,
};

const canvasContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
};

const buttonContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: '8px',
    borderRadius: '5px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
};

const buttonStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '6px 10px',
  border: '1px solid #ccc',
  backgroundColor: '#f8f8f8',
  borderRadius: '4px',
  fontSize: '13px',
  textAlign: 'center',
  minWidth: '90px',
  transition: 'background-color 0.2s ease',
};

const clearButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: 'white',
    borderColor: '#d32f2f',
};


const instructionsPanelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    width: '280px',
    maxHeight: 'calc(100vh - 20px)',
    overflowY: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '12px',
    borderRadius: '5px',
    zIndex: 99,
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    fontSize: '13px',
    lineHeight: '1.4'
};

const sectionHeaderStyle: React.CSSProperties = {
    marginTop: '10px',
    marginBottom: '5px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '4px',
    fontSize: '14px',
    fontWeight: '600',
};

const listStyle: React.CSSProperties = {
    paddingLeft: '18px',
    margin: '0 0 8px 0',
    listStyleType: 'disc'
};

const codeStyle: React.CSSProperties = {
    backgroundColor: '#eee',
    padding: '1px 4px',
    borderRadius: '3px',
    fontFamily: 'monospace',
    fontSize: '12px'
};


const popupStyle: React.CSSProperties = {
    position: 'absolute',
    height: 'auto',
    width: '220px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid #bbb',
    padding: '15px',
    display: 'none',
    zIndex: 101,
    borderRadius: '6px',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.25)'
};

const popupHeaderStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: 0,
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
};

const popupListStyle: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0
};


const popupItemStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '8px 10px',
    marginBottom: '6px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
};

const popupColorPreviewStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    marginRight: '10px',
    border: '1px solid #777',
    borderRadius: '3px',
    flexShrink: 0
};

const removalIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -100px)',
    color: '#B71C1C',
    backgroundColor: 'rgba(255, 235, 238, 0.9)',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    pointerEvents: 'none',
    zIndex: 105,
    border: '1px solid #EF9A9A'
};

export default GeoBuild;