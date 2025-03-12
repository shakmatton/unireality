import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;

// Detecta se é dispositivo móvel
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Vetor com os caminhos das imagens das lixeiras (ordem: Amarelo, Vermelho, Verde, Azul)
const trashBinImages = [
  "./gltf/imgs/pla.jpg",      // pla = plástico, lixeira vermelha
  "./gltf/imgs/vi.jpg",       // vi = vidro, lixeira verde
  "./gltf/imgs/pa.jpg",        // pa = papel, lixeira azul
  "./gltf/imgs/me.jpg",       // me = metal, lixeira amarela
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
    btnZoomOriginal.style.width = isMobile ? "32px" : "35px";
    btnZoomOriginal.style.height = isMobile ? "32px" : "35px";
    btnZoomOriginal.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomOriginal();
    });
    uiContainer.appendChild(btnZoomOriginal);

    const btnZoomPlus = document.createElement("img");
    btnZoomPlus.src = "./gltf/imgs/plus.jpg";
    btnZoomPlus.alt = "Zoom+";
    btnZoomPlus.style.cursor = "pointer";
    btnZoomPlus.style.width = isMobile ? "32px" : "35px";
    btnZoomPlus.style.height = isMobile ? "32px" : "35px";
    btnZoomPlus.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomIn();
    });
    uiContainer.appendChild(btnZoomPlus);

    const btnZoomMinus = document.createElement("img");
    btnZoomMinus.src = "./gltf/imgs/minus.jpg";
    btnZoomMinus.alt = "Zoom-";
    btnZoomMinus.style.cursor = "pointer";
    btnZoomMinus.style.width = isMobile ? "32px" : "35px";
    btnZoomMinus.style.height = isMobile ? "32px" : "35px";
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
    btnOnOff.style.height = isMobile ? "32px" : "35px";
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
    btnReset.style.height = isMobile ? "32px" : "35px";
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
    btnMandala.style.height = isMobile ? "40px" : "40px"; // igual ao Home no mobile
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
    trashBinImg.style.top = isMobile ? "60px" : "80px";
    trashBinImg.style.right = "10px";
    trashBinImg.style.width = isMobile ? "40px" : "40px";
    trashBinImg.style.height = "auto";
    trashBinImg.style.display = "none";
    document.body.appendChild(trashBinImg);

    // ============== NOVAS IMAGENS ADICIONADAS ==============
    const coleteImg = document.createElement("img");
    coleteImg.src = "./gltf/imgs/colete.png";
    coleteImg.alt = "Colete";
    coleteImg.style.position = "absolute";
    coleteImg.style.top = isMobile ? "290px" : "320px";
    coleteImg.style.right = "10px";
    coleteImg.style.width = isMobile ? "40px" : "40px";
    coleteImg.style.height = "auto";
    coleteImg.style.pointerEvents = "none";
    document.body.appendChild(coleteImg);

    const recicleImg = document.createElement("img");
    recicleImg.src = "./gltf/imgs/recicle.png";
    recicleImg.alt = "Recicle";
    recicleImg.style.position = "absolute";
    recicleImg.style.top = isMobile ? "360px" : "390px";
    recicleImg.style.right = "10px";
    recicleImg.style.width = isMobile ? "40px" : "40px";
    recicleImg.style.height = "auto";
    recicleImg.style.pointerEvents = "none";
    document.body.appendChild(recicleImg);

    // Adicionados após o ícone Recicle
    const loop2Img = document.createElement("img");
    loop2Img.src = "./gltf/imgs/loop-2.png";
    loop2Img.alt = "Loop 2";
    loop2Img.style.position = "absolute";
    loop2Img.style.top = isMobile ? "460px" : "470px";
    loop2Img.style.right = "10px";
    loop2Img.style.width = isMobile ? "40px" : "40px";
    loop2Img.style.height = "auto";
    loop2Img.style.pointerEvents = "none";
    document.body.appendChild(loop2Img);

    const loop3Img = document.createElement("img");
    loop3Img.src = "./gltf/imgs/loop-3.png";
    loop3Img.alt = "Loop 3";
    loop3Img.style.position = "absolute";
    loop3Img.style.top = isMobile ? "510px" : "520px";
    loop3Img.style.right = "10px";
    loop3Img.style.width = isMobile ? "40px" : "40px";
    loop3Img.style.height = "auto";
    loop3Img.style.pointerEvents = "none";
    document.body.appendChild(loop3Img);
    // =======================================================

    function updateTrashBinImage() {
      trashBinImg.src = trashBinImages[currentColorIndex];
      trashBinImg.style.display = "block";
    }

    // Botão Sair - posicionado no canto superior esquerdo
    const btnSair = document.createElement("img");
    btnSair.src = "./gltf/imgs/sair.png";
    btnSair.alt = "Sair";
    btnSair.style.cursor = "pointer";
    btnSair.style.height = isMobile ? "40px" : "50px";
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