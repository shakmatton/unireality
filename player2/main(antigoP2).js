/* import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./targets.mind",
    });

    const { scene, camera, renderer } = mindarThree;

    // Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Load 3D models
    const me = await loadGLTF("./gltf/me.gltf");
    const pa = await loadGLTF("./gltf/pa.gltf");
    const pla = await loadGLTF("./gltf/pla.gltf");
    const vi = await loadGLTF("./gltf/vi.gltf");

    // Scale & position models
    const models = [me, pa, pla, vi];
    const positions = [
      [0, 0, 0],
      [0.5, 0.5, 0],
      [-0.5, -0.5, 0],
      [0.5, -0.5, 0],
    ];

    models.forEach((model, i) => {
      model.scene.scale.set(0.13, 0.13, 0.13);
      model.scene.position.set(...positions[i]);
      model.scene.userData.clickable = true;
    });

    // Add models to AR anchors
    const anchors = models.map((model, i) => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(model.scene);
      return anchor;
    });

    // Pointer event handling
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingModel = null;
    let initialPointer = new THREE.Vector2();
    let initialPosition = new THREE.Vector3();

    function onPointerDown(e) {
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      pointer.x = (clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.clickable) {
          obj = obj.parent;
        }

        if (obj.userData.clickable) {
          draggingModel = obj;
          initialPointer.set(clientX, clientY);
          initialPosition.copy(draggingModel.position);
        }
      }
    }

    function onPointerMove(e) {
      if (!draggingModel) return;

      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const deltaX = (clientX - initialPointer.x) * 0.002575; // Adjust scaling
      const deltaY = (clientY - initialPointer.y) * -0.002575; // Invert Y for correct movement

      draggingModel.position.set(
        initialPosition.x + deltaX,
        initialPosition.y + deltaY,
        initialPosition.z
      );
    }

    function onPointerUp() {
      draggingModel = null;
    }

    // Add event listeners for pointer and touch events
    document.body.addEventListener("pointerdown", onPointerDown);
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerup", onPointerUp);

    document.body.addEventListener("touchstart", onPointerDown);
    document.body.addEventListener("touchmove", onPointerMove);
    document.body.addEventListener("touchend", onPointerUp);

    // Start AR rendering loop
    await mindarThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };

  start();
});

*/