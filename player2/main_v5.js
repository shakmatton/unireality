import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Caminhos das imagens das lixeiras (ordem: Vermelha, Verde, Azul, Amarela)
const trashBinImages = [
  "./gltf/imgs/pla.jpg",    // Vermelha
  "./gltf/imgs/vi.jpg",     // Verde
  "./gltf/imgs/pa.jpg",     // Azul
  "./gltf/imgs/me.jpg"      // Amarela
];
let currentColorIndex = -1; // Usado pela Mandala para atualizar cor

// Mapping das plaquinhas para cada cor (4 cores, cada uma com 3 tipos, na ordem: left, right, up)
const platesMapping = {
  0: { left: "./gltf/imgs/vermelho_left.png", right: "./gltf/imgs/vermelho_right.png", up: "./gltf/imgs/vermelho_up.png" },
  1: { left: "./gltf/imgs/verde_left.png",    right: "./gltf/imgs/verde_right.png",    up: "./gltf/imgs/verde_up.png"    },
  2: { left: "./gltf/imgs/azul_left.png",     right: "./gltf/imgs/azul_right.png",     up: "./gltf/imgs/azul_up.png"     },
  3: { left: "./gltf/imgs/amarelo_left.png",  right: "./gltf/imgs/amarelo_right.png",  up: "./gltf/imgs/amarelo_up.png"  }
};

// Mapping para determinar qual modelo 3D corresponde a cada placa
const plateModelIndices = {
  0: { left: 3, right: 7, up: 11 }, // Vermelha: r_left, r_right, r_up
  1: { left: 2, right: 6, up: 10 }, // Verde: g_left, g_right, g_up
  2: { left: 1, right: 5, up: 9  }, // Azul:  b_left, b_right, b_up
  3: { left: 0, right: 4, up: 8  }  // Amarela: y_left, y_right, y_up
};

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    // Instancia o MindAR
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./p2_papel.mind"
    });
    const { scene, camera, renderer } = mindarThree;
    
    // Adiciona iluminação
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    // Carrega os modelos 3D
    const y_left      = await loadGLTF("./gltf/amarelo_left.gltf");
    const b_left      = await loadGLTF("./gltf/azul_left.gltf");
    const g_left      = await loadGLTF("./gltf/verde_left.gltf");
    const r_left      = await loadGLTF("./gltf/vermelho_left.gltf");
    const y_right     = await loadGLTF("./gltf/amarelo_right.gltf");
    const b_right     = await loadGLTF("./gltf/azul_right.gltf");
    const g_right     = await loadGLTF("./gltf/verde_right.gltf");
    const r_right     = await loadGLTF("./gltf/vermelho_right.gltf");
    const y_up        = await loadGLTF("./gltf/amarelo_up.gltf");
    const b_up        = await loadGLTF("./gltf/azul_up.gltf");
    const g_up        = await loadGLTF("./gltf/verde_up.gltf");
    const r_up        = await loadGLTF("./gltf/vermelho_up.gltf");
    const colete2     = await loadGLTF("./gltf/colete2.gltf");
    const recicle     = await loadGLTF("./gltf/recicle.gltf");
    const loop2_molde = await loadGLTF("./gltf/loop2_molde.gltf");
    const loop3_molde = await loadGLTF("./gltf/loop3_molde.gltf");
    
    // Ordem dos modelos:
    // 0: y_left, 1: b_left, 2: g_left, 3: r_left,
    // 4: y_right, 5: b_right, 6: g_right, 7: r_right,
    // 8: y_up, 9: b_up, 10: g_up, 11: r_up,
    // 12: colete2, 13: recicle, 14: loop2_molde, 15: loop3_molde.
    const models = [
      y_left, b_left, g_left, r_left,
      y_right, b_right, g_right, r_right,
      y_up, b_up, g_up, r_up,
      colete2, recicle, loop2_molde, loop3_molde
    ];
    
    const positions = [
      [0, 0, 0], [0.2, 0.2, 0], [-0.2, -0.2, 0], [0.2, -0.2, 0],
      [0.1, 0.1, 0], [0.3, 0.3, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0],
      [0.4, 0.4, 0], [0.6, 0.6, 0], [-0.6, -0.6, 0], [0.6, -0.6, 0],
      [-0.1, -0.1, 0], [-0.4, -0.4, 0], [-0.5, -0.5, 0], [0.5, -0.5, 0]
    ];
    
    // Configura os modelos originais
    models.forEach((model, i) => {
      model.scene.scale.set(0.13, 0.13, 0.13);
      model.scene.userData.originalScale = model.scene.scale.clone();
      model.scene.position.set(...positions[i]);
      model.scene.userData.originalPosition = model.scene.position.clone();
      model.scene.userData.originalRotation = model.scene.rotation.clone();
      model.scene.userData.clickable = true;
      model.scene.userData.modelIndex = i; // Adiciona índice do modelo
      model.scene.userData.tapCount = 0;
      model.scene.userData.tapTimer = null;
      if (i >= 8 && i < 12) {
        model.scene.userData.rotatable = true;
        model.scene.userData.targetRotation = model.scene.rotation.z;
      } else {
        model.scene.userData.rotatable = false;
      }
    });
    
    // Adiciona cada modelo a uma âncora AR
    const anchors = models.map(model => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(model.scene);
      return anchor;
    });
    
    // Oculta os modelos originais para começar com a tela limpa
    models.forEach(model => model.scene.visible = false);
    
    // Cria um grupo para os clones (objetos "nascidos")
    const clonesGroup = new THREE.Group();
    scene.add(clonesGroup);
    
    // --- FUNÇÃO PARA CLONAR COM CÓPIA DE PROPRIEDADES ---
    const cloneCounts = {};
    models.forEach((_, i) => cloneCounts[i] = 0);

    function addClone(modelIndex, position = null) {
      const originalModel = models[modelIndex].scene;
      const clone = originalModel.clone();
      clone.userData = {
        clickable: originalModel.userData.clickable,
        rotatable: originalModel.userData.rotatable,
        targetRotation: originalModel.userData.targetRotation,
        originalScale: originalModel.userData.originalScale.clone(),
        originalPosition: originalModel.userData.originalPosition.clone(),
        originalRotation: originalModel.userData.originalRotation.clone(),
        modelIndex: originalModel.userData.modelIndex,
        isClone: true,
        tapCount: 0,
        tapTimer: null
      };
      
      if (position) {
        clone.position.copy(position).add(new THREE.Vector3(0.3, -0.2, 0));
      } else {
        const cloneCount = cloneCounts[modelIndex]++;
        clone.position.set(
          originalModel.position.x + 0.3 * cloneCount,
          originalModel.position.y - 0.2 * cloneCount,
          originalModel.position.z
        );
      }
      
      anchors[modelIndex].group.add(clone);
    }
    
    // --- ÁREA DE PLAQUINHAS (abaixo da lixeira) ---
    const platesForTrashContainer = document.createElement("div");
    platesForTrashContainer.style.position = "absolute";
    platesForTrashContainer.style.top = isMobile ? "125px" : "145px";
    platesForTrashContainer.style.right = "10px";
    platesForTrashContainer.style.display = "flex";
    platesForTrashContainer.style.flexDirection = "column";
    platesForTrashContainer.style.gap = "5px";
    document.body.appendChild(platesForTrashContainer);
    
    function updatePlatesForTrash() {
      platesForTrashContainer.innerHTML = "";
      if (currentColorIndex === -1) return;
      // Ordem desejada: left, right, up (de cima para baixo)
      const iconLeft = document.createElement("img");
      iconLeft.src = platesMapping[currentColorIndex].left;
      iconLeft.alt = "Placa Left";
      iconLeft.style.width = isMobile ? "41px" : "40px";
      iconLeft.style.cursor = "pointer";
      iconLeft.addEventListener("click", (e) => {
        e.stopPropagation();
        addClone( plateModelIndices[currentColorIndex].left );
      });
      platesForTrashContainer.appendChild(iconLeft);
      
      const iconRight = document.createElement("img");
      iconRight.src = platesMapping[currentColorIndex].right;
      iconRight.alt = "Placa Right";
      iconRight.style.width = isMobile ? "41px" : "40px";
      iconRight.style.cursor = "pointer";
      iconRight.addEventListener("click", (e) => {
        e.stopPropagation();
        addClone( plateModelIndices[currentColorIndex].right );
      });
      platesForTrashContainer.appendChild(iconRight);
      
      const iconUp = document.createElement("img");
      iconUp.src = platesMapping[currentColorIndex].up;
      iconUp.alt = "Placa Up";
      iconUp.style.width = isMobile ? "41px" : "40px";
      iconUp.style.cursor = "pointer";
      iconUp.addEventListener("click", (e) => {
        e.stopPropagation();
        addClone( plateModelIndices[currentColorIndex].up );
      });
      platesForTrashContainer.appendChild(iconUp);
    }
    
    // --- ÍCONES PARA INVOCAR OBJETOS 3D (fora da área de plaquinhas) ---
    const recicleIcon = document.createElement("img");
    recicleIcon.src = "./gltf/imgs/recicle.png";
    recicleIcon.alt = "Recicle";
    recicleIcon.style.position = "absolute";
    recicleIcon.style.top = isMobile ? "360px" : "390px";
    recicleIcon.style.right = "10px";
    recicleIcon.style.width = "40px";
    recicleIcon.style.height = "auto";
    recicleIcon.style.cursor = "pointer";
    recicleIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      addClone(13);
    });
    document.body.appendChild(recicleIcon);
    
    const coleteIcon = document.createElement("img");
    coleteIcon.src = "./gltf/imgs/colete2.png";
    coleteIcon.alt = "Colete";
    coleteIcon.style.position = "absolute";
    coleteIcon.style.top = isMobile ? "290px" : "320px";
    coleteIcon.style.right = "9px";
    coleteIcon.style.width = "42px";
    coleteIcon.style.height = "auto";
    coleteIcon.style.cursor = "pointer";
    coleteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      addClone(12);
    });
    document.body.appendChild(coleteIcon);
    
    const loop2Icon = document.createElement("img");
    loop2Icon.src = "./gltf/imgs/loop-2.png";
    loop2Icon.alt = "Loop 2";
    loop2Icon.style.position = "absolute";
    loop2Icon.style.top = isMobile ? "460px" : "470px";
    loop2Icon.style.right = "10px";
    loop2Icon.style.width = "40px";
    loop2Icon.style.height = "auto";
    loop2Icon.style.cursor = "pointer";
    loop2Icon.addEventListener("click", (e) => {
      e.stopPropagation();
      addClone(14);
    });
    document.body.appendChild(loop2Icon);
    
    const loop3Icon = document.createElement("img");
    loop3Icon.src = "./gltf/imgs/loop-3.png";
    loop3Icon.alt = "Loop 3";
    loop3Icon.style.position = "absolute";
    loop3Icon.style.top = isMobile ? "510px" : "520px";
    loop3Icon.style.right = "10px";
    loop3Icon.style.width = "40px";
    loop3Icon.style.height = "auto";
    loop3Icon.style.cursor = "pointer";
    loop3Icon.addEventListener("click", (e) => {
      e.stopPropagation();
      addClone(15);
    });
    document.body.appendChild(loop3Icon);
    
    // --- INTERAÇÃO COM A CENA (DRAG, ROTATION e TRIPLE-CLICK REMOVAL) ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingModel = null;
    let initialPointer = new THREE.Vector2();
    let initialPosition = new THREE.Vector3();
    let isDragging = false;
    let currentTapObject = null;
    const TAP_DELAY = 300;
    
    function onPointerDown(e) {
      if (e.target.closest("#uiContainerBottom") || e.target.closest(".corner-btn") || e.target.closest(".top-btn"))
        return;
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
      if (isDragging) {
        isDragging = false;
        return;
      }

      if (!currentTapObject) return;
      
      const obj = currentTapObject;
      obj.userData.tapCount = (obj.userData.tapCount || 0) + 1;

      if (obj.userData.tapTimer) {
        clearTimeout(obj.userData.tapTimer);
      }

      obj.userData.tapTimer = setTimeout(() => {
        const taps = obj.userData.tapCount;
        
        if (taps === 1 && obj.userData.rotatable) {
          // Rotação para objetos rotacionáveis
          obj.userData.targetRotation += THREE.Math.degToRad(90);
        } else if (taps === 2) {
          // Duplicar objeto
          addClone(obj.userData.modelIndex, obj.position.clone());
        } else if (taps >= 3) {
          // Remover objeto
          if (obj.parent) {
            obj.parent.remove(obj);
          }
        }

        obj.userData.tapCount = 0;
        obj.userData.tapTimer = null;
      }, TAP_DELAY);

      currentTapObject = null;
    }
    
    document.body.addEventListener("pointerdown", onPointerDown);
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerup", onPointerUp);
    document.body.addEventListener("touchstart", onPointerDown);
    document.body.addEventListener("touchmove", onPointerMove);
    document.body.addEventListener("touchend", onPointerUp);
    
    // --- UI: BOTÕES INFERIORES ---
    const uiContainerBottom = document.createElement("div");
    uiContainerBottom.id = "uiContainerBottom";
    uiContainerBottom.style.position = "absolute";
    uiContainerBottom.style.bottom = "20px";
    uiContainerBottom.style.left = "50%";
    uiContainerBottom.style.transform = "translateX(-50%)";
    uiContainerBottom.style.display = "flex";
    uiContainerBottom.style.gap = "10px";
    uiContainerBottom.style.zIndex = "1000";
    uiContainerBottom.style.pointerEvents = "auto";
    document.body.appendChild(uiContainerBottom);
    
    function zoomIn() {
      models.forEach(model => {
        model.scene.scale.multiplyScalar(1.1);
      });
      clonesGroup.children.forEach(clone => {
        clone.scale.multiplyScalar(1.1);
      });
    }
    function zoomOut() {
      models.forEach(model => {
        model.scene.scale.multiplyScalar(0.9);
      });
      clonesGroup.children.forEach(clone => {
        clone.scale.multiplyScalar(0.9);
      });
    }
    function zoomOriginal() {
      models.forEach(model => {
        model.scene.scale.copy(model.scene.userData.originalScale);
      });
      while (clonesGroup.children.length > 0) {
        clonesGroup.remove(clonesGroup.children[0]);
      }
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
    uiContainerBottom.appendChild(btnZoomOriginal);
    
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
    uiContainerBottom.appendChild(btnZoomPlus);
    
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
    uiContainerBottom.appendChild(btnZoomMinus);
    
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
      clonesGroup.children.forEach(clone => {
        clone.visible = objetosVisiveis;
      });
      btnOnOff.src = objetosVisiveis ? "./gltf/imgs/off.jpg" : "./gltf/imgs/on.jpg";
    });
    uiContainerBottom.appendChild(btnOnOff);
    
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
      while (clonesGroup.children.length > 0) {
        clonesGroup.remove(clonesGroup.children[0]);
      }
    });
    uiContainerBottom.appendChild(btnReset);
    
    // --- BOTÃO MANDALA (canto superior direito) ---
    let mandalaTapCount = 0;
    let mandalaTapTimer = null;
    let mandalaRotation = 0;
    const btnMandala = document.createElement("img");
    btnMandala.src = "./gltf/imgs/mandala.jpg";
    btnMandala.alt = "Mandala";
    btnMandala.style.cursor = "pointer";
    btnMandala.style.height = isMobile ? "40px" : "40px";
    btnMandala.style.width = "auto";
    btnMandala.style.position = "absolute";
    btnMandala.style.top = "10px";
    btnMandala.style.right = "10px";
    btnMandala.style.transition = "transform 0.3s ease";
    btnMandala.addEventListener("pointerdown", (e) => { e.stopPropagation(); });
    btnMandala.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      mandalaTapCount++;
      if (mandalaTapCount === 1) {
        mandalaTapTimer = setTimeout(() => {
          mandalaRotation += 90;
          btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
          currentColorIndex = (currentColorIndex + 1) % 4;
          updateTrashBinImage();
          updatePlatesForTrash();
          mandalaTapCount = 0;
        }, TAP_DELAY);
      } else if (mandalaTapCount === 2) {
        clearTimeout(mandalaTapTimer);
        mandalaRotation -= 90;
        btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
        currentColorIndex = (currentColorIndex + 1) % 4;
        updateTrashBinImage();
        updatePlatesForTrash();
        mandalaTapCount = 0;
      }
    });
    document.body.appendChild(btnMandala);
    
    function updateTrashBinImage() {
      trashBinImg.src = trashBinImages[currentColorIndex];
      trashBinImg.style.display = "block";
    }
    
    // --- BOTÃO SAIR (canto superior esquerdo) ---
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
    
    // --- ELEMENTO LIXEIRA ---
    const trashBinImg = document.createElement("img");
    trashBinImg.alt = "Lixeira";
    trashBinImg.style.position = "absolute";
    trashBinImg.style.top = isMobile ? "60px" : "80px";
    trashBinImg.style.right = "10px";
    trashBinImg.style.width = "40px";
    trashBinImg.style.height = "auto";
    trashBinImg.style.display = "none";
    document.body.appendChild(trashBinImg);
    
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