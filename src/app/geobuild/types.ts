import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';


export interface GeoBuildState {
  mouseX: number | null;
  mouseY: number | null;
  isVisible: boolean; 
  showInstructions: boolean;
}


export type ObjectType = 'floor' | 'wall' | 'roof' | 'door';


export interface SceneObject {
  obj: THREE.Object3D; 
  objType: ObjectType;
  side?: string; 
}


export interface ThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  pointerLockControls: PointerLockControls;
  dragControls: DragControls;
  snapRadius: THREE.Mesh; 
  light: THREE.PointLight;
  gridHelper: THREE.GridHelper;
  ambientLight: THREE.AmbientLight;
}