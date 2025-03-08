import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./p2_papel.mind",
    });

    const { scene, camera, renderer } = mindarThree;

    // Iluminação
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Carregamento dos modelos 3D
    const me = await loadGLTF("./gltf/me.gltf");
    const pa = await loadGLTF("./gltf/pa.gltf");
    const pla = await loadGLTF("./gltf/pla.gltf");
    const vi = await loadGLTF("./gltf/vi.gltf");
    // const teste = await loadGLTF("./gltf/arrow5_copia_teste.gltf");

    const models = [me, pa, pla, vi, /*teste*/];
    const positions = [
      [0, 0, 0],
      [0.5, 0.5, 0],
      [-0.5, -0.5, 0],
      [0.5, -0.5, 0],
      // [0.4, -0.4, 0],
    ];

    // Configura posições, escalas e guarda estado original (para Reset/Zoom Original)
    models.forEach((model, i) => {
      model.scene.scale.set(0.13, 0.13, 0.13);
      model.scene.userData.originalScale = model.scene.scale.clone();
      model.scene.position.set(...positions[i]);
      model.scene.userData.originalPosition = model.scene.position.clone();
      model.scene.userData.originalRotation = model.scene.rotation.clone();
      model.scene.userData.clickable = true;
    });

    // Adiciona cada modelo a uma âncora AR
    const anchors = models.map((model) => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(model.scene);
      return anchor;
    });

    // Variáveis para interação: translação e rotação por toque
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingModel = null;
    let initialPointer = new THREE.Vector2();
    let initialPosition = new THREE.Vector3();
    let isDragging = false;
    let currentTapObject = null;

    // Variáveis para diferenciar toque único de duplo toque
    let tapTimer = null;
    let tapCount = 0;
    const TAP_DELAY = 300; // ms para diferenciar um duplo toque

    function onPointerDown(e) {
      // Ignora se o clique for em algum elemento da UI
      if (e.target.closest("#uiContainer")) return;

      isDragging = false;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      initialPointer.set(clientX, clientY);

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
          currentTapObject = obj; // para rotação por toque
          initialPosition.copy(draggingModel.position);
        }
      }
    }

    function onPointerMove(e) {
      if (!draggingModel) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = clientX - initialPointer.x;
      const dy = clientY - initialPointer.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
      }
      if (isDragging) {
        const deltaX = dx * 0.002575;
        const deltaY = dy * -0.002575;
        draggingModel.position.set(
          initialPosition.x + deltaX,
          initialPosition.y + deltaY,
          initialPosition.z
        );
      }
    }

    function onPointerUp(e) {
      // Se não houve drag, trata como toque para rotação
      if (!isDragging && currentTapObject) {
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            // Toque único: rotaciona 90° no sentido anti‑horário
            currentTapObject.rotation.z -= THREE.Math.degToRad(90);
            tapCount = 0;
            currentTapObject = null;
          }, TAP_DELAY);
        } else if (tapCount === 2) {
          clearTimeout(tapTimer);
          // Duplo toque: rotaciona 90° no sentido horário
          currentTapObject.rotation.z += THREE.Math.degToRad(90);
          tapCount = 0;
          currentTapObject = null;
        }
      }
      draggingModel = null;
    }

    document.body.addEventListener("pointerdown", onPointerDown);
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerup", onPointerUp);
    document.body.addEventListener("touchstart", onPointerDown);
    document.body.addEventListener("touchmove", onPointerMove);
    document.body.addEventListener("touchend", onPointerUp);

    // Criação da interface de botões no canto inferior central (estilo Windows 11)
    const uiContainer = document.createElement("div");
    uiContainer.id = "uiContainer";
    uiContainer.style.position = "absolute";
    uiContainer.style.bottom = "20px";
    uiContainer.style.left = "50%";
    uiContainer.style.transform = "translateX(-50%)";
    uiContainer.style.display = "flex";
    uiContainer.style.gap = "10px";
    uiContainer.style.zIndex = "1000";
    uiContainer.style.pointerEvents = "auto";
    document.body.appendChild(uiContainer);

    // Funções para zoom
    function zoomIn() {
      models.forEach(model => {
        model.scene.scale.multiplyScalar(1.1);
      });
    }
    function zoomOut() {
      models.forEach(model => {
        model.scene.scale.multiplyScalar(0.9);
      });
    }
    function zoomOriginal() {
      models.forEach(model => {
        model.scene.scale.copy(model.scene.userData.originalScale);
      });
    }

    // Botão Zoom Original (House)
    const btnZoomOriginal = document.createElement("img");
    btnZoomOriginal.src = "/player2/gltf/imgs/home.png"; // imagem da casa (Home)
    btnZoomOriginal.alt = "Zoom Original";
    btnZoomOriginal.style.cursor = "pointer";
    btnZoomOriginal.style.width = "40px";
    btnZoomOriginal.style.height = "40px";
    btnZoomOriginal.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomOriginal();
    });
    uiContainer.appendChild(btnZoomOriginal);

    // Botão Zoom +
    const btnZoomPlus = document.createElement("img");
    btnZoomPlus.src = "/player2/gltf/imgs/plus.jpg"; // Zoom+
    btnZoomPlus.alt = "Zoom+";
    btnZoomPlus.style.cursor = "pointer";
    btnZoomPlus.style.width = "40px";
    btnZoomPlus.style.height = "40px";
    btnZoomPlus.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomIn();
    });
    uiContainer.appendChild(btnZoomPlus);

    // Botão Zoom -
    const btnZoomMinus = document.createElement("img");
    btnZoomMinus.src = "/player2/gltf/imgs/minus.jpg"; // Zoom-
    btnZoomMinus.alt = "Zoom-";
    btnZoomMinus.style.cursor = "pointer";
    btnZoomMinus.style.width = "40px";
    btnZoomMinus.style.height = "40px";
    btnZoomMinus.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomOut();
    });
    uiContainer.appendChild(btnZoomMinus);

    // Botão ON/OFF (imagens com palavras)
    let objetosVisiveis = true;
    const btnOnOff = document.createElement("img");
    btnOnOff.src = "/player2/gltf/imgs/off.jpg"; // imagem com a palavra "OFF"
    btnOnOff.alt = "ON/OFF";
    btnOnOff.style.cursor = "pointer";
    btnOnOff.style.height = "40px";
    btnOnOff.style.width = "auto";
    btnOnOff.addEventListener("click", (e) => {
      e.stopPropagation();
      objetosVisiveis = !objetosVisiveis;
      models.forEach(model => {
        model.scene.visible = objetosVisiveis;
      });
      btnOnOff.src = objetosVisiveis ? "/player2/gltf/imgs/off.jpg" : "/player2/gltf/imgs/on.jpg";
    });
    uiContainer.appendChild(btnOnOff);

    // Botão Reset (imagens com palavras)
    const btnReset = document.createElement("img");
    btnReset.src = "/player2/gltf/imgs/reset.jpg"; // imagem com a palavra "Reset"
    btnReset.alt = "Reset";
    btnReset.style.cursor = "pointer";
    btnReset.style.height = "40px";
    btnReset.style.width = "auto";
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      models.forEach(model => {
        model.scene.position.copy(model.scene.userData.originalPosition);
        model.scene.rotation.copy(model.scene.userData.originalRotation);
        model.scene.scale.copy(model.scene.userData.originalScale);
      });
    });
    uiContainer.appendChild(btnReset);

    // Inicia o loop de renderização AR
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };

  start();
});





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