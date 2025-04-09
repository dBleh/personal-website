import * as THREE from 'three';
import { ObjectType } from './types';

export const objIns = (vThree: THREE.Vector3, objType: ObjectType): THREE.Object3D | null => {
  if (!(vThree instanceof THREE.Vector3)) {
    console.error('objIns: vThree must be an instance of THREE.Vector3');
    return null;
  }

  const pObj = new THREE.Object3D();

  let obj: THREE.Mesh | null = null;
  let wireframeMesh: THREE.Mesh | null = null;
  let dummyMesh: THREE.Mesh | null = null;

  if (objType === 'floor') {
    const objGeometry = new THREE.BoxGeometry(10, 5, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0xEEA47F });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    obj = new THREE.Mesh(objGeometry, material);
    wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
  } else if (objType === 'wall') {
    const objGeometry = new THREE.BoxGeometry(10, 10, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0x5DADE2 });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    obj = new THREE.Mesh(objGeometry, material);
    wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
  } else if (objType === 'roof') {
    const objGeometry = new THREE.BoxGeometry(10, 0.2, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0xAF601A });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    obj = new THREE.Mesh(objGeometry, material);
    wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
  } else if (objType === 'door') {
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-5, -5);
    wallShape.lineTo(-5, 5);
    wallShape.lineTo(5, 5);
    wallShape.lineTo(5, -5);
    wallShape.lineTo(-5, -5);

    const doorHole = new THREE.Shape();
    const holeBottomY = -5;
    const holeTopY = 2;
    const holeHalfWidth = 2.5;
    doorHole.moveTo(-holeHalfWidth, holeBottomY);
    doorHole.lineTo(-holeHalfWidth, holeTopY);
    doorHole.lineTo(holeHalfWidth, holeTopY);
    doorHole.lineTo(holeHalfWidth, holeBottomY);
    doorHole.lineTo(-holeHalfWidth, holeBottomY);
    wallShape.holes.push(doorHole);

    const frameExtrudeSettings = { depth: 0.2, bevelEnabled: false };
    const doorFrameGeometry = new THREE.ExtrudeGeometry(wallShape, frameExtrudeSettings);
    const frameSolidMaterial = new THREE.MeshBasicMaterial({ color: 0xCD6155 });
    const frameWireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });

    obj = new THREE.Mesh(doorFrameGeometry, frameSolidMaterial);
    wireframeMesh = new THREE.Mesh(doorFrameGeometry, frameWireframeMaterial);
    obj.add(wireframeMesh);

    const panelExtrudeSettings = { depth: 0.18, bevelEnabled: false };
    const doorPanelGeometry = new THREE.ExtrudeGeometry(doorHole, panelExtrudeSettings);
    const doorPanelSolidMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const doorPanelWireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true });

    const doorPanelMesh = new THREE.Mesh(doorPanelGeometry, doorPanelSolidMaterial);
    const doorPanelWireframeMesh = new THREE.Mesh(doorPanelGeometry, doorPanelWireframeMaterial);
    doorPanelMesh.add(doorPanelWireframeMesh);

    obj.add(doorPanelMesh);

    const dummyGeometry = new THREE.BoxGeometry(10, 10, 0.2);
    const dummyMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    dummyMesh = new THREE.Mesh(dummyGeometry, dummyMaterial);
    dummyMesh.visible = false;
    obj.userData.dummyMesh = dummyMesh;

  } else {
    const objGeometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshBasicMaterial({ color: 0x8AAAE5 });
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    obj = new THREE.Mesh(objGeometry, material);
    wireframeMesh = new THREE.Mesh(objGeometry, wireframeMaterial);
    obj.add(wireframeMesh);
  }

  if (obj) {
    obj.position.copy(vThree);
    pObj.add(obj);

    if (dummyMesh) {
       dummyMesh.position.copy(obj.position);
       dummyMesh.quaternion.copy(obj.quaternion);
       pObj.add(dummyMesh);
    }

    return pObj;
  }

  return null;
};