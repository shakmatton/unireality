import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;

// Detecta se é dispositivo móvel
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Vetor com os caminhos das imagens das lixeiras (ordem: Amarelo, Vermelho, Verde, Azul)
const trashBinImages = [
  "./gltf/imgs/me.jpg",
  "./gltf/imgs/pla.jpg",
  "./gltf/imgs/vi.jpg",
  "./gltf/imgs/pla.jpg"
];
// Índice atual; inicia com -1 (nenhuma exibida)
let currentColorIndex = -1;

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
    const y_left = await loadGLTF("./gltf/amarelo_left.gltf");
    const b_left = await loadGLTF("./gltf/azul_left.gltf");
    const g_left = await loadGLTF("./gltf/verde_left.gltf");
    const r_left = await loadGLTF("./gltf/vermelho_left.gltf");

    const y_right = await loadGLTF("./gltf/amarelo_right.gltf");
    const b_right = await loadGLTF("./gltf/azul_right.gltf");
    const g_right = await loadGLTF("./gltf/verde_right.gltf");
    const r_right = await loadGLTF("./gltf/vermelho_right.gltf");

    const y_up = await loadGLTF("./gltf/amarelo_up.gltf");
    const b_up = await loadGLTF("./gltf/azul_up.gltf");
    const g_up = await loadGLTF("./gltf/verde_up.gltf");
    const r_up = await loadGLTF("./gltf/vermelho_up.gltf");

    const colete2 = await loadGLTF("./gltf/colete2.gltf");
    const recicle = await loadGLTF("./gltf/recicle.gltf");
    const loop_0 = await loadGLTF("./gltf/loop0.gltf");
    const loop_molde = await loadGLTF("./gltf/loop_molde.gltf");

    const models = [y_left, b_left, g_left, r_left,
                    y_right, b_right, g_right, r_right,
                    y_up, b_up, g_up, r_up,
                    colete2, recicle, loop_0, loop_molde];

    const positions = [
      [0, 0, 0], [0.2, 0.2, 0], [-0.2, -0.2, 0], [0.2, -0.2, 0],
      [0.1, 0.1, 0], [0.3, 0.3, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0],
      [0.4, 0.4, 0], [0.6, 0.6, 0], [-0.6, -0.6, 0], [0.6, -0.6, 0],
      [-0.1, -0.1, 0], [-0.4, -0.4, 0], [-0.5, -0.5, 0], [0.5, -0.5, 0]
    ];

    // Configura posições, escalas e guarda estado original (para Reset/Zoom)
    models.forEach((model, i) => {
      model.scene.scale.set(0.13, 0.13, 0.13);
      model.scene.userData.originalScale = model.scene.scale.clone();
      model.scene.position.set(...positions[i]);
      model.scene.userData.originalPosition = model.scene.position.clone();
      model.scene.userData.originalRotation = model.scene.rotation.clone();
      model.scene.userData.clickable = true;

      // Apenas os modelos "up" (índices 8 a 11) serão rotacionáveis
      if (i >= 8 && i < 12) {
        model.scene.userData.rotatable = true;
        model.scene.userData.targetRotation = model.scene.rotation.z;
      } else {
        model.scene.userData.rotatable = false;
      }
    });

    // Adiciona cada modelo a uma âncora AR
    const anchors = models.map((model) => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(model.scene);
      return anchor;
    });

    // Variáveis para interação na cena: translação e rotação por toque
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingModel = null;
    let initialPointer = new THREE.Vector2();
    let initialPosition = new THREE.Vector3();
    let isDragging = false;
    let currentTapObject = null;

    // Variáveis para diferenciar toque único de duplo toque (na cena)
    let tapTimer = null;
    let tapCount = 0;
    const TAP_DELAY = 300;

    function onPointerDown(e) {
      if (e.target.closest("#uiContainer") || e.target.closest(".corner-btn") || e.target.closest(".top-btn")) return;
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
          currentTapObject = obj;
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
      if (!isDragging && currentTapObject) {
        // Só aplica rotação se o objeto for rotacionável
        if (!currentTapObject.userData.rotatable) {
          draggingModel = null;
          return;
        }
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            // Para objetos "up": inverter a direção
            // Agora, toque único: adiciona 90° (em vez de subtrair)
            currentTapObject.userData.targetRotation += THREE.Math.degToRad(90);
            tapCount = 0;
            currentTapObject = null;
          }, TAP_DELAY);
        } else if (tapCount === 2) {
          clearTimeout(tapTimer);
          // Duplo toque: subtrai 90°
          currentTapObject.userData.targetRotation -= THREE.Math.degToRad(90);
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

    // --- Interface de Botões ---
    // Container central para botões inferiores (Zoom, ON/OFF, Reset)
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

    const btnZoomOriginal = document.createElement("img");
    btnZoomOriginal.src = "./gltf/imgs/home.png";
    btnZoomOriginal.alt = "Zoom Original";
    btnZoomOriginal.style.cursor = "pointer";
    btnZoomOriginal.style.width = isMobile ? "30px" : "40px";
    btnZoomOriginal.style.height = isMobile ? "30px" : "40px";
    btnZoomOriginal.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomOriginal();
    });
    uiContainer.appendChild(btnZoomOriginal);

    const btnZoomPlus = document.createElement("img");
    btnZoomPlus.src = "./gltf/imgs/plus.jpg";
    btnZoomPlus.alt = "Zoom+";
    btnZoomPlus.style.cursor = "pointer";
    btnZoomPlus.style.width = isMobile ? "30px" : "40px";
    btnZoomPlus.style.height = isMobile ? "30px" : "40px";
    btnZoomPlus.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomIn();
    });
    uiContainer.appendChild(btnZoomPlus);

    const btnZoomMinus = document.createElement("img");
    btnZoomMinus.src = "./gltf/imgs/minus.jpg";
    btnZoomMinus.alt = "Zoom-";
    btnZoomMinus.style.cursor = "pointer";
    btnZoomMinus.style.width = isMobile ? "30px" : "40px";
    btnZoomMinus.style.height = isMobile ? "30px" : "40px";
    btnZoomMinus.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomOut();
    });
    uiContainer.appendChild(btnZoomMinus);

    let objetosVisiveis = true;
    const btnOnOff = document.createElement("img");
    btnOnOff.src = "./gltf/imgs/off.jpg";
    btnOnOff.alt = "ON/OFF";
    btnOnOff.style.cursor = "pointer";
    btnOnOff.style.height = isMobile ? "30px" : "40px";
    btnOnOff.style.width = "auto";
    btnOnOff.addEventListener("click", (e) => {
      e.stopPropagation();
      objetosVisiveis = !objetosVisiveis;
      models.forEach(model => {
        model.scene.visible = objetosVisiveis;
      });
      btnOnOff.src = objetosVisiveis ? "./gltf/imgs/off.jpg" : "./gltf/imgs/on.jpg";
    });
    uiContainer.appendChild(btnOnOff);

    const btnReset = document.createElement("img");
    btnReset.src = "./gltf/imgs/reset.jpg";
    btnReset.alt = "Reset";
    btnReset.style.cursor = "pointer";
    btnReset.style.height = isMobile ? "30px" : "40px";
    btnReset.style.width = "auto";
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      models.forEach(model => {
        model.scene.position.copy(model.scene.userData.originalPosition);
        model.scene.rotation.copy(model.scene.userData.originalRotation);
        model.scene.scale.copy(model.scene.userData.originalScale);
        if (model.scene.userData.rotatable) {
          model.scene.userData.targetRotation = model.scene.userData.originalRotation.z;
        }
      });
    });
    uiContainer.appendChild(btnReset);

    // Botão Mandala - posicionado no canto superior direito
    let mandalaTapCount = 0;
    let mandalaTapTimer = null;
    let mandalaRotation = 0; // em graus
    const btnMandala = document.createElement("img");
    btnMandala.src = "./gltf/imgs/mandala.jpg";
    btnMandala.alt = "Mandala";
    btnMandala.style.cursor = "pointer";
    btnMandala.style.height = isMobile ? "30px" : "60px"; // igual ao Home no mobile
    btnMandala.style.width = "auto";
    btnMandala.style.position = "absolute";
    btnMandala.style.top = "10px";
    btnMandala.style.right = "10px";
    btnMandala.style.transition = "transform 0.3s ease";
    btnMandala.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    btnMandala.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      mandalaTapCount++;
      if (mandalaTapCount === 1) {
        mandalaTapTimer = setTimeout(() => {
          // Invertido: toque único adiciona 90°
          mandalaRotation += 90;
          btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
          // Atualiza índice da cor
          currentColorIndex = (currentColorIndex + 1) % 4;
          updateTrashBinImage();
          mandalaTapCount = 0;
        }, TAP_DELAY);
      } else if (mandalaTapCount === 2) {
        clearTimeout(mandalaTapTimer);
        // Duplo toque: subtrai 90°
        mandalaRotation -= 90;
        btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
        currentColorIndex = (currentColorIndex + 1) % 4;
        updateTrashBinImage();
        mandalaTapCount = 0;
      }
    });
    document.body.appendChild(btnMandala);

    // Cria o elemento para a lixeira, inicialmente escondido
    const trashBinImg = document.createElement("img");
    trashBinImg.alt = "Lixeira";
    trashBinImg.style.position = "absolute";
    // Posiciona abaixo do botão Mandala; ajuste a posição conforme necessário
    trashBinImg.style.top = isMobile ? "50px" : "80px";
    trashBinImg.style.right = "10px";
    trashBinImg.style.width = isMobile ? "30px" : "40px";
    trashBinImg.style.height = "auto";
    trashBinImg.style.display = "none";
    document.body.appendChild(trashBinImg);

    function updateTrashBinImage() {
      // Exibe a imagem da lixeira de acordo com o índice atual
      trashBinImg.src = trashBinImages[currentColorIndex];
      trashBinImg.style.display = "block";
    }

    // Botão Sair - posicionado no canto superior esquerdo
    const btnSair = document.createElement("img");
    btnSair.src = "./gltf/imgs/sair.png";
    btnSair.alt = "Sair";
    btnSair.style.cursor = "pointer";
    btnSair.style.height = isMobile ? "40px" : "60px";
    btnSair.style.width = "auto";
    btnSair.style.position = "absolute";
    btnSair.style.top = "10px";
    btnSair.style.left = "10px";
    btnSair.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = "https://shakmatton.github.io/unireality";
    });
    document.body.appendChild(btnSair);

    // Loop de animação: atualiza a rotação suave dos objetos "up"
    renderer.setAnimationLoop(() => {
      models.forEach(model => {
        if (model.scene.userData.rotatable) {
          const current = model.scene.rotation.z;
          const target = model.scene.userData.targetRotation;
          const diff = target - current;
          if (Math.abs(diff) > 0.01) {
            model.scene.rotation.z += diff * 0.1;
          } else {
            model.scene.rotation.z = target;
          }
        }
      });
      renderer.render(scene, camera);
    });
    
    await mindarThree.start();
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