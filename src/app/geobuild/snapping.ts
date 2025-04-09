import * as THREE from 'three';
import { SceneObject } from './types'; 


export const addSnaps = (selectedObject: SceneObject, isVisible: boolean): SceneObject[] => {
  const snapObjs: SceneObject[] = [];
  const objGeometry = new THREE.BoxGeometry(1, 1, 1);


  const matT = new THREE.MeshBasicMaterial({ color: 0xf00fff }); 
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });  

  if (!selectedObject.obj.parent) {
      console.warn("Cannot add snaps: selectedObject's mesh is not attached to a parent Object3D.");
      return snapObjs;
  }
  const parentContainer = selectedObject.obj.parent;

  const q = new THREE.Quaternion().copy(selectedObject.obj.quaternion);

  if (selectedObject.objType === 'floor') {
    const snapPositions = {
      right: new THREE.Vector3(5, 2, 0),
      back: new THREE.Vector3(0, 2, 5),
      front: new THREE.Vector3(0, 2, -5),
      left: new THREE.Vector3(-5, 2, 0),
    };

    snapPositions.right.applyQuaternion(q);
    snapPositions.left.applyQuaternion(q);
    snapPositions.front.applyQuaternion(q);
    snapPositions.back.applyQuaternion(q);

    const snapObjLeft = new THREE.Mesh(objGeometry, mat);
    snapObjLeft.position.copy(selectedObject.obj.position).add(snapPositions.left);
    snapObjLeft.quaternion.copy(selectedObject.obj.quaternion);
    snapObjLeft.rotateY(Math.PI / 2); 
    parentContainer.add(snapObjLeft); 
    snapObjLeft.visible = isVisible;
    snapObjs.push({ obj: snapObjLeft, objType: 'floor', side: 'left' });

    const snapObjRight = new THREE.Mesh(objGeometry, mat); 
    snapObjRight.position.copy(selectedObject.obj.position).add(snapPositions.right);
    snapObjRight.quaternion.copy(selectedObject.obj.quaternion);
    snapObjRight.rotateY(-Math.PI / 2);
    parentContainer.add(snapObjRight);
    snapObjRight.visible = isVisible;
    snapObjs.push({ obj: snapObjRight, objType: 'floor', side: 'right' });

    const snapObjBack = new THREE.Mesh(objGeometry, matT); 
    snapObjBack.position.copy(selectedObject.obj.position).add(snapPositions.back);
    snapObjBack.quaternion.copy(selectedObject.obj.quaternion);
    snapObjBack.rotateY(Math.PI);
    parentContainer.add(snapObjBack);
    snapObjBack.visible = isVisible;
    snapObjs.push({ obj: snapObjBack, objType: 'floor', side: 'back' });

    const snapObjFront = new THREE.Mesh(objGeometry, matT); 
    snapObjFront.position.copy(selectedObject.obj.position).add(snapPositions.front);
    snapObjFront.quaternion.copy(selectedObject.obj.quaternion);
    parentContainer.add(snapObjFront);
    snapObjFront.visible = isVisible;
    snapObjs.push({ obj: snapObjFront, objType: 'floor', side: 'front' });

  } else if (selectedObject.objType === 'wall' || selectedObject.objType === 'door') {
    const snapPos = new THREE.Vector3(0, 5, -0.1); 
    const snapObj = new THREE.Mesh(objGeometry, mat); 
    snapPos.applyQuaternion(q); 
    snapObj.position.copy(selectedObject.obj.position).add(snapPos);
    snapObj.quaternion.copy(selectedObject.obj.quaternion); 
    parentContainer.add(snapObj);
    snapObj.visible = isVisible;
    snapObjs.push({
        obj: snapObj,
        objType: selectedObject.objType,
    });
  }
  return snapObjs;
};


export const getIntersectObj = (targetObject: SceneObject, snapRadius: THREE.Mesh): SceneObject | false => {
  const targetBounds = new THREE.Box3().setFromObject(targetObject.obj);
  const radiusBounds = new THREE.Box3().setFromObject(snapRadius);
  const intersects = targetBounds.intersectsBox(radiusBounds);
  return intersects ? targetObject : false;
};


export const setPosition = (
    objToSnap: SceneObject,         
    selectedObject: SceneObject,
    snapRadius: THREE.Mesh        
): THREE.Vector3 | false => {

 
  let offset = 0;

  if (selectedObject.objType === 'wall' && selectedObject.obj instanceof THREE.Mesh &&
      selectedObject.obj.geometry instanceof THREE.BoxGeometry) {
    offset = 10 / 2 + 0.5; 
  } else if (selectedObject.objType === 'floor') {
    offset = -2; 
  } else if (selectedObject.objType === 'roof') {
    offset = 0.1;
  } else if (selectedObject.objType === 'door') {
    offset = 5.5; 
  } else {
     
      console.warn(`setPosition: Unexpected geometry or type for offset calculation: ${selectedObject.objType}`);
      offset = 0;
  }  
  const snappedDirection = new THREE.Vector3(0, 0, -1); 
  snappedDirection.applyQuaternion(objToSnap.obj.quaternion);
  snappedDirection.normalize(); 

 
  selectedObject.obj.position.copy(objToSnap.obj.position);

  selectedObject.obj.position.y += offset;


  if (selectedObject.objType === "floor") {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);

    const direction = snappedDirection.clone().multiplyScalar(5); 
    selectedObject.obj.position.add(direction);
  }

  else if (selectedObject.objType === "wall") {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);

    
    const direction = snappedDirection.clone().multiplyScalar(-0.1); 
    selectedObject.obj.position.add(direction);

    if (objToSnap.objType === "roof") {
      selectedObject.obj.position.y -= 1;
    }
    if (objToSnap.objType === "wall") {
      selectedObject.obj.position.y -= 0.5;
    }
  }

  else if (selectedObject.objType === 'roof') {
    if (objToSnap.objType !== 'wall' && objToSnap.objType !== 'door') {
      console.warn("Roof can only snap to Wall or Door snap points.");
      return false; 
    }

    const object1Position = objToSnap.obj.position.clone(); 
  
    const object2WorldPosition = new THREE.Vector3();
    snapRadius.getWorldPosition(object2WorldPosition);
    const vectorToObject2 = object2WorldPosition.clone().sub(object1Position);

    const dotProduct = snappedDirection.dot(vectorToObject2.normalize());

    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);

    
    let direction;
    if (dotProduct < 0) { 
      direction = snappedDirection.clone().multiplyScalar(-5); 
    } else { 
      direction = snappedDirection.clone().multiplyScalar(5); 
    }
    selectedObject.obj.position.add(direction);
  }

  else if (selectedObject.objType === "door") {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, -1), snappedDirection);
    selectedObject.obj.quaternion.copy(q);

    
    const direction = snappedDirection.clone().multiplyScalar(-0.1);
    selectedObject.obj.position.add(direction);

    if (objToSnap.objType === "roof") {
      selectedObject.obj.position.y -= 1;
    }
    if (objToSnap.objType === "wall") {
      selectedObject.obj.position.y -= 0.5;
    }

    if (selectedObject.obj.userData && selectedObject.obj.userData.dummyMesh) {
        const dummyMesh = selectedObject.obj.userData.dummyMesh as THREE.Mesh;
        dummyMesh.position.copy(selectedObject.obj.position);
        dummyMesh.quaternion.copy(selectedObject.obj.quaternion);
    }
  }
  return selectedObject.obj.position;
};