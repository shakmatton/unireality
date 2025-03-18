import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Caminhos das imagens das lixeiras (ordem: Vermelha, Verde, Azul, Amarela)
const trashBinImages = [
  "player2/gltf/imgs/pla.jpg",    // Vermelha
  "player2/gltf/imgs/vi.jpg",     // Verde
  "player2/gltf/imgs/pa.jpg",     // Azul
  "player2/gltf/imgs/me.jpg"      // Amarela
];
let currentColorIndex = -1; // Usado pela Mandala para atualizar cor

// Mapping das plaquinhas para cada cor (4 cores, cada uma com 3 tipos, na ordem: left, right, up)
const platesMapping = {
  0: { left: "player2/gltf/imgs/vermelho_left.png", right: "player2/gltf/imgs/vermelho_right.png", up: "player2/gltf/imgs/vermelho_up.png" },
  1: { left: "player2/gltf/imgs/verde_left.png",    right: "player2/gltf/imgs/verde_right.png",    up: "player2/gltf/imgs/verde_up.png"    },
  2: { left: "player2/gltf/imgs/azul_left.png",     right: "player2/gltf/imgs/azul_right.png",     up: "player2/gltf/imgs/azul_up.png"     },
  3: { left: "player2/gltf/imgs/amarelo_left.png",  right: "player2/gltf/imgs/amarelo_right.png",  up: "player2/gltf/imgs/amarelo_up.png"  }
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
    const y_left      = await loadGLTF("player2/gltf/amarelo_left.gltf");
    const b_left      = await loadGLTF("player2/gltf/azul_left.gltf");
    const g_left      = await loadGLTF("player2/gltf/verde_left.gltf");
    const r_left      = await loadGLTF("player2/gltf/vermelho_left.gltf");
    const y_right     = await loadGLTF("player2/gltf/amarelo_right.gltf");
    const b_right     = await loadGLTF("player2/gltf/azul_right.gltf");
    const g_right     = await loadGLTF("player2/gltf/verde_right.gltf");
    const r_right     = await loadGLTF("player2/gltf/vermelho_right.gltf");
    const y_up        = await loadGLTF("player2/gltf/amarelo_up.gltf");
    const b_up        = await loadGLTF("player2/gltf/azul_up.gltf");
    const g_up        = await loadGLTF("player2/gltf/verde_up.gltf");
    const r_up        = await loadGLTF("player2/gltf/vermelho_up.gltf");
    const colete2     = await loadGLTF("player2/gltf/colete2.gltf");
    const recicle     = await loadGLTF("player2/gltf/recicle.gltf");
    const loop2_molde = await loadGLTF("player2/gltf/loop2_molde.gltf");
    const loop3_molde = await loadGLTF("player2/gltf/loop3_molde.gltf");
    
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
    recicleIcon.src = "player2/gltf/imgs/recicle.png";
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
    coleteIcon.src = "player2/gltf/imgs/colete2.png";
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
    loop2Icon.src = "player2/gltf/imgs/loop-2.png";
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
    loop3Icon.src = "player2/gltf/imgs/loop-3.png";
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
    btnZoomOriginal.src = "player2/gltf/imgs/home.png";
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
    btnZoomPlus.src = "player2/gltf/imgs/plus.jpg";
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
    btnZoomMinus.src = "player2/gltf/imgs/minus.jpg";
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
    btnOnOff.src = "player2/gltf/imgs/off.jpg";
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
      btnOnOff.src = objetosVisiveis ? "player2/gltf/imgs/off.jpg" : "player2/gltf/imgs/on.jpg";
    });
    uiContainerBottom.appendChild(btnOnOff);
    
    const btnReset = document.createElement("img");
    btnReset.src = "player2/gltf/imgs/reset.jpg";
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
    btnMandala.src = "player2/gltf/imgs/mandala.jpg";
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
    btnSair.src = "player2/gltf/imgs/sair.png";
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


















// import { loadGLTF } from "./loader.js";

// const THREE = window.MINDAR.IMAGE.THREE;
// const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// // Imagens para a lixeira (ordem: amarelo, azul, verde, vermelho)
// const trashBinImages = [
//   "./gltf/imgs/me.jpg",
//   "./gltf/imgs/pa.jpg",
//   "./gltf/imgs/vi.jpg",
//   "./gltf/imgs/pla.jpg"
// ];

// // Imagens para as plaquinhas – para cada tipo (left, right, up) e para cada cor
// const platesMapping = {
//   0: { left: "./gltf/imgs/vermelho_left.png", right: "./gltf/imgs/vermelho_right.png", up: "./gltf/imgs/vermelho_up.png" },
//   1: { left: "./gltf/imgs/verde_left.png",    right: "./gltf/imgs/verde_right.png",    up: "./gltf/imgs/verde_up.png"    },
//   2: { left: "./gltf/imgs/azul_left.png",     right: "./gltf/imgs/azul_right.png",     up: "./gltf/imgs/azul_up.png"     },
//   3: { left: "./gltf/imgs/amarelo_left.png",  right: "./gltf/imgs/amarelo_right.png",  up: "./gltf/imgs/amarelo_up.png"  }
// };

// let currentColorIndex = 0; // Inicia com 0 para que as plaquinhas apareçam

// document.addEventListener("DOMContentLoaded", () => {
//   const start = async () => {
//     /* =============================
//        Inicialização do MindAR
//        ============================= */
//     const mindarThree = new window.MINDAR.IMAGE.MindARThree({
//       container: document.body,
//       imageTargetSrc: "./p2_papel.mind"
//     });
//     const { scene, camera, renderer } = mindarThree;
    
//     // Configure o canvas com z-index alto para receber eventos
//     renderer.domElement.style.position = "absolute";
//     renderer.domElement.style.zIndex = "10";
    
//     // Iluminação básica
//     const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
//     scene.add(light);
    
//     /* =============================
//        Grupo de Objetos 3D: Recicle
//        ============================= */
//     const recicleGroup = new THREE.Group();
//     const anchor = mindarThree.addAnchor(0);
//     anchor.group.add(recicleGroup);
//     anchor.onTargetFound = () => {
//       console.log("Alvo detectado! (scanner continua ativo)");
//     };
    
//     const recicleGroupInitialScale = recicleGroup.scale.clone();
    
//     // Carrega o GLTF do objeto Recicle
//     const recicleGLTF = await loadGLTF("./gltf/recicle.gltf");
    
//     // Função para criar uma instância do objeto Recicle
//     function createRecicleInstance(offset = new THREE.Vector3(0, 0, 0)) {
//       const recicleObj = recicleGLTF.scene.clone();
//       recicleObj.scale.set(0.1, 0.1, 0.1); // escala menor
//       recicleObj.position.copy(offset);
//       recicleObj.userData = {
//         initialTransform: {
//           position: recicleObj.position.clone(),
//           rotation: recicleObj.rotation.clone(),
//           scale: recicleObj.scale.clone()
//         },
//         clickCount: 0,
//         clickTimer: null,
//         isRecicle: true,
//         clickable: true,
//         rotatable: false // para Recicle, clique único NÃO roda (rotação só para "up")
//       };
//       // Atualiza bounding boxes para o raycaster
//       recicleObj.traverse(child => {
//         if (child.isMesh && child.geometry) {
//           child.geometry.computeBoundingBox();
//           child.raycast = THREE.Mesh.prototype.raycast;
//           child.userData.clickable = true;
//         }
//       });
//       recicleObj.updateMatrixWorld();
//       return recicleObj;
//     }
    
//     // Cria o objeto Recicle original e o adiciona ao grupo
//     const originalRecicle = createRecicleInstance(new THREE.Vector3(0.5, 0, 0));
//     recicleGroup.add(originalRecicle);
    
//     /* =============================
//        Eventos de Interação para Recicle
//        (Arrastar, Clique, Duplicar e Remover)
//        ============================= */
//     const raycaster = new THREE.Raycaster();
//     const pointer = new THREE.Vector2();
//     let draggingObject = null;
//     let dragOffset = new THREE.Vector3();
//     let pointerDownPos = new THREE.Vector2();
//     // Plano de arrasto com normal (0,0,1)
//     const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    
//     renderer.domElement.addEventListener("pointerdown", (event) => {
//       console.log("pointerdown:", event.clientX, event.clientY);
//       pointerDownPos.set(event.clientX, event.clientY);
//       const rect = renderer.domElement.getBoundingClientRect();
//       pointer.set(
//         ((event.clientX - rect.left) / rect.width) * 2 - 1,
//         -((event.clientY - rect.top) / rect.height) * 2 + 1
//       );
//       raycaster.setFromCamera(pointer, camera);
//       const intersects = raycaster.intersectObjects(recicleGroup.children, true);
//       if (intersects.length > 0) {
//         console.log("Interseção detectada:", intersects[0].object);
//         draggingObject = intersects[0].object;
//         while (!draggingObject.userData.isRecicle && draggingObject.parent) {
//           draggingObject = draggingObject.parent;
//         }
//         const objectWorldPos = new THREE.Vector3();
//         draggingObject.getWorldPosition(objectWorldPos);
//         dragPlane.constant = -objectWorldPos.z;
//         const intersectPointWorld = new THREE.Vector3();
//         raycaster.ray.intersectPlane(dragPlane, intersectPointWorld);
//         const localIntersectPoint = intersectPointWorld.clone();
//         anchor.group.worldToLocal(localIntersectPoint);
//         dragOffset.copy(draggingObject.position).sub(localIntersectPoint);
//       } else {
//         console.log("Nenhuma interseção detectada no pointerdown.");
//       }
//     });
    
//     renderer.domElement.addEventListener("pointermove", (event) => {
//       console.log("pointermove:", event.clientX, event.clientY);
//       if (draggingObject) {
//         const rect = renderer.domElement.getBoundingClientRect();
//         pointer.set(
//           ((event.clientX - rect.left) / rect.width) * 2 - 1,
//           -((event.clientY - rect.top) / rect.height) * 2 + 1
//         );
//         raycaster.setFromCamera(pointer, camera);
//         const intersectPointWorld = new THREE.Vector3();
//         const hit = raycaster.ray.intersectPlane(dragPlane, intersectPointWorld);
//         if (hit) {
//           const localIntersectPoint = intersectPointWorld.clone();
//           anchor.group.worldToLocal(localIntersectPoint);
//           const speedFactor = 2.0; // Aumenta a velocidade do arrasto
//           // Multiplicamos o dragOffset para ampliar o deslocamento
//           draggingObject.position.copy(localIntersectPoint.add(dragOffset.multiplyScalar(speedFactor)));
//           console.log("Objeto arrastado para (local):", draggingObject.position);
//         } else {
//           console.log("Sem interseção no pointermove.");
//         }
//       }
//     });
    
//     renderer.domElement.addEventListener("pointerup", (event) => {
//       console.log("pointerup:", event.clientX, event.clientY);
//       if (draggingObject) {
//         const dx = event.clientX - pointerDownPos.x;
//         const dy = event.clientY - pointerDownPos.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//         if (dist < 5) {
//           // Clique rápido (não arrasto): trata cliques
//           const clickedObject = draggingObject;
//           clickedObject.userData.clickCount = (clickedObject.userData.clickCount || 0) + 1;
//           console.log("Clique detectado. clickCount:", clickedObject.userData.clickCount);
//           if (clickedObject.userData.clickTimer) {
//             clearTimeout(clickedObject.userData.clickTimer);
//           }
//           clickedObject.userData.clickTimer = setTimeout(() => {
//             if (clickedObject.userData.clickCount === 2) {
//               // Duplo clique: duplicar o objeto usando a mesma função de criação
//               const cloneOffset = new THREE.Vector3(0.2, -0.2, 0);
//               const newPos = clickedObject.position.clone().add(cloneOffset);
//               const clone = createRecicleInstance(newPos);
//               recicleGroup.add(clone);
//               console.log("Recicle duplicado (2 cliques)");
//             } else if (clickedObject.userData.clickCount >= 3) {
//               // Triplo clique: remove o objeto
//               recicleGroup.remove(clickedObject);
//               console.log("Recicle removido (3 cliques)");
//             }
//             clickedObject.userData.clickCount = 0;
//             clickedObject.userData.clickTimer = null;
//           }, 300);
//         }
//       }
//       draggingObject = null;
//     });
    
//     /* =============================
//        UI – BASEADO NO CÓDIGO DE APOIO
//        ============================= */
    
//     // UI inferior – Container para botões de Zoom (quadrados)
//     const zoomContainer = document.createElement("div");
//     zoomContainer.style.position = "absolute";
//     zoomContainer.style.bottom = "20px";
//     zoomContainer.style.left = "50%";
//     zoomContainer.style.transform = "translateX(-50%)";
//     zoomContainer.style.display = "flex";
//     zoomContainer.style.gap = "10px";
//     zoomContainer.style.zIndex = "1000";
//     zoomContainer.style.pointerEvents = "auto";
//     document.body.appendChild(zoomContainer);
    
//     function createUIButton(src, alt, onClick) {
//       const btn = document.createElement("img");
//       btn.src = src;
//       btn.alt = alt;
//       btn.style.cursor = "pointer";
//       // Dimensões originais: 32px (mobile) ou 35px (desktop)
//       btn.style.width = isMobile ? "32px" : "35px";
//       btn.style.height = isMobile ? "32px" : "35px";
//       btn.style.pointerEvents = "auto";
//       btn.addEventListener("click", (e) => {
//         e.stopPropagation();
//         onClick();
//       });
//       return btn;
//     }
    
//     function zoomIn() {
//       recicleGroup.scale.multiplyScalar(1.1);
//       console.log("Zoom In acionado");
//     }
//     function zoomOut() {
//       recicleGroup.scale.multiplyScalar(0.9);
//       console.log("Zoom Out acionado");
//     }
//     function zoomOriginal() {
//       recicleGroup.scale.copy(recicleGroupInitialScale);
//       resetRecicleGroup();
//       console.log("Zoom Original acionado");
//     }
    
//     zoomContainer.appendChild(createUIButton("./gltf/imgs/home.png", "Zoom Original", zoomOriginal));
//     zoomContainer.appendChild(createUIButton("./gltf/imgs/plus.jpg", "Zoom+", zoomIn));
//     zoomContainer.appendChild(createUIButton("./gltf/imgs/minus.jpg", "Zoom-", zoomOut));
    
//     // UI inferior – Container para botões ON/OFF e Reset (retangulares)
//     // Criamos uma função específica para botões retangulares, sem forçar dimensões quadradas
//     function createRectangularButton(src, alt, onClick) {
//       const btn = document.createElement("img");
//       btn.src = src;
//       btn.alt = alt;
//       btn.style.cursor = "pointer";
//       btn.style.maxHeight = isMobile ? "40px" : "50px";
//       btn.style.pointerEvents = "auto";
//       btn.addEventListener("click", (e) => {
//         e.stopPropagation();
//         onClick();
//       });
//       return btn;
//     }
    
//     const controlContainer = document.createElement("div");
//     controlContainer.style.position = "absolute";
//     controlContainer.style.bottom = "20px";
//     controlContainer.style.right = "10px";
//     controlContainer.style.display = "flex";
//     controlContainer.style.flexDirection = "column";
//     controlContainer.style.gap = "10px";
//     controlContainer.style.zIndex = "1000";
//     controlContainer.style.pointerEvents = "auto";
//     document.body.appendChild(controlContainer);
    
//     let objetosVisiveis = true;
//     controlContainer.appendChild(createRectangularButton("./gltf/imgs/off.jpg", "ON/OFF", () => {
//       objetosVisiveis = !objetosVisiveis;
//       recicleGroup.visible = objetosVisiveis;
//       console.log("ON/OFF acionado:", objetosVisiveis);
//     }));
    
//     controlContainer.appendChild(createRectangularButton("./gltf/imgs/reset.jpg", "Reset", () => {
//       resetRecicleGroup();
//     }));
    
//     function resetRecicleGroup() {
//       recicleGroup.children.forEach(child => {
//         if(child === originalRecicle) {
//           if(child.userData.initialTransform) {
//             child.position.copy(child.userData.initialTransform.position);
//             child.rotation.copy(child.userData.initialTransform.rotation);
//             child.scale.copy(child.userData.initialTransform.scale);
//           }
//         } else {
//           recicleGroup.remove(child);
//         }
//       });
//       console.log("RecicleGroup reset");
//     }
    
//     // Menu lateral – ícones do lado direito
//     const menuContainer = document.createElement("div");
//     menuContainer.style.position = "absolute";
//     menuContainer.style.top = "170px"; // Aumentado para dar mais espaço (abaixo da lixeira)
//     menuContainer.style.right = "10px";
//     menuContainer.style.display = "flex";
//     menuContainer.style.flexDirection = "column";
//     menuContainer.style.gap = "25px"; // Gap maior entre os ícones
//     menuContainer.style.zIndex = "1000";
//     document.body.appendChild(menuContainer);
    
//     // Ícone Recicle – gera um novo objeto Recicle com todas as funcionalidades
//     const recicleIcon = document.createElement("img");
//     recicleIcon.src = "./gltf/imgs/recicle.png";
//     recicleIcon.alt = "Recicle";
//     recicleIcon.style.width = "40px";
//     recicleIcon.style.height = "auto";
//     recicleIcon.style.cursor = "pointer";
//     recicleIcon.addEventListener("click", (e) => {
//       e.stopPropagation();
//       const offset = new THREE.Vector3(0.5, 0, 0).add(new THREE.Vector3(0.2, -0.2, 0));
//       const newRecicle = createRecicleInstance(offset);
//       recicleGroup.add(newRecicle);
//       console.log("Recicle criado via ícone Recicle");
//     });
//     menuContainer.appendChild(recicleIcon);
    
//     // Ícone Colete (exemplo; sem funcionalidades adicionais)
//     const coleteIcon = document.createElement("img");
//     coleteIcon.src = "./gltf/imgs/colete.png";
//     coleteIcon.alt = "Colete";
//     coleteIcon.style.width = "40px";
//     coleteIcon.style.height = "auto";
//     coleteIcon.style.cursor = "pointer";
//     coleteIcon.addEventListener("click", (e) => { e.stopPropagation(); });
//     menuContainer.appendChild(coleteIcon);
    
//     // Ícone Loop2_molde
//     const loop2Icon = document.createElement("img");
//     loop2Icon.src = "./gltf/imgs/loop-2.png";
//     loop2Icon.alt = "Loop 2";
//     loop2Icon.style.width = "40px";
//     loop2Icon.style.height = "auto";
//     loop2Icon.style.cursor = "pointer";
//     loop2Icon.addEventListener("click", (e) => { e.stopPropagation(); });
//     menuContainer.appendChild(loop2Icon);
    
//     // Ícone Loop3_molde
//     const loop3Icon = document.createElement("img");
//     loop3Icon.src = "./gltf/imgs/loop-3.png";
//     loop3Icon.alt = "Loop 3";
//     loop3Icon.style.width = "40px";
//     loop3Icon.style.height = "auto";
//     loop3Icon.style.cursor = "pointer";
//     loop3Icon.addEventListener("click", (e) => { e.stopPropagation(); });
//     menuContainer.appendChild(loop3Icon);
    
//     // Área de plaquinhas (abaixo da lixeira) – com gap maior
//     const platesForTrashContainer = document.createElement("div");
//     platesForTrashContainer.style.position = "absolute";
//     platesForTrashContainer.style.top = "250px"; // Ajustado para dar mais espaço abaixo da lixeira
//     platesForTrashContainer.style.right = "10px";
//     platesForTrashContainer.style.display = "flex";
//     platesForTrashContainer.style.flexDirection = "column";
//     platesForTrashContainer.style.gap = "5px";
//     platesForTrashContainer.style.alignItems = "center";
//     platesForTrashContainer.style.zIndex = "1000";
//     document.body.appendChild(platesForTrashContainer);
    
//     function updatePlatesForTrash() {
//       platesForTrashContainer.innerHTML = "";
//       if (currentColorIndex === -1) return;
//       const plateTypes = ["left", "right", "up"];
//       plateTypes.forEach(type => {
//         const plateImg = document.createElement("img");
//         plateImg.src = platesMapping[currentColorIndex][type];
//         plateImg.alt = `Placa ${type}`;
//         plateImg.style.width = isMobile ? "41px" : "40px";
//         plateImg.style.cursor = "pointer";
//         // Clique nas plaquinhas (exemplo: nenhuma ação definida)
//         plateImg.addEventListener("click", (e) => { e.stopPropagation(); });
//         platesForTrashContainer.appendChild(plateImg);
//       });
//     }
    
//     // Ícone Fingers – logo abaixo da Mandala
//     const fingersIcon = document.createElement("img");
//     fingersIcon.src = "./gltf/imgs/fingers1b.jpg";
//     fingersIcon.alt = "Fingers";
//     fingersIcon.style.position = "absolute";
//     fingersIcon.style.top = "50px";
//     fingersIcon.style.right = "10px";
//     fingersIcon.style.width = "40px";
//     fingersIcon.style.height = "auto";
//     fingersIcon.style.zIndex = "1000";
//     document.body.appendChild(fingersIcon);
    
//     // Elemento Lixeira – fica abaixo do Fingers
//     const trashBinImg = document.createElement("img");
//     trashBinImg.alt = "Lixeira";
//     trashBinImg.style.position = "absolute";
//     trashBinImg.style.top = "110px"; // Ajustado para dar espaçamento
//     trashBinImg.style.right = "10px";
//     trashBinImg.style.width = "40px";
//     trashBinImg.style.height = "auto";
//     trashBinImg.style.display = "none";
//     trashBinImg.style.zIndex = "1000";
//     document.body.appendChild(trashBinImg);
    
//     // Botão Mandala (canto superior direito)
//     let mandalaTapCount = 0;
//     let mandalaTapTimer = null;
//     let mandalaRotation = 0;
//     const TAP_DELAY = 300;
//     const btnMandala = document.createElement("img");
//     btnMandala.src = "./gltf/imgs/mandala.jpg";
//     btnMandala.alt = "Mandala";
//     btnMandala.style.cursor = "pointer";
//     btnMandala.style.height = isMobile ? "40px" : "40px";
//     btnMandala.style.width = "auto";
//     btnMandala.style.position = "absolute";
//     btnMandala.style.top = "10px";
//     btnMandala.style.right = "10px";
//     btnMandala.style.transition = "transform 0.3s ease";
//     btnMandala.addEventListener("pointerdown", (e) => { e.stopPropagation(); });
//     btnMandala.addEventListener("pointerup", (e) => {
//       e.stopPropagation();
//       mandalaTapCount++;
//       if (mandalaTapCount === 1) {
//         mandalaTapTimer = setTimeout(() => {
//           mandalaRotation += 90;
//           btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
//           currentColorIndex = (currentColorIndex + 1) % 4;
//           updatePlatesForTrash();
//           trashBinImg.src = trashBinImages[currentColorIndex];
//           trashBinImg.style.display = "block";
//           mandalaTapCount = 0;
//         }, TAP_DELAY);
//       } else if (mandalaTapCount === 2) {
//         clearTimeout(mandalaTapTimer);
//         mandalaRotation -= 90;
//         btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
//         currentColorIndex = (currentColorIndex + 1) % 4;
//         updatePlatesForTrash();
//         trashBinImg.src = trashBinImages[currentColorIndex];
//         trashBinImg.style.display = "block";
//         mandalaTapCount = 0;
//       }
//     });
//     document.body.appendChild(btnMandala);
    
//     // Botão Sair (canto superior esquerdo)
//     const btnSair = document.createElement("img");
//     btnSair.src = "./gltf/imgs/sair.png";
//     btnSair.alt = "Sair";
//     btnSair.style.cursor = "pointer";
//     btnSair.style.height = isMobile ? "40px" : "50px";
//     btnSair.style.width = "auto";
//     btnSair.style.position = "absolute";
//     btnSair.style.top = "10px";
//     btnSair.style.left = "10px";
//     btnSair.addEventListener("click", (e) => {
//       e.stopPropagation();
//       window.location.href = "https://shakmatton.github.io/unireality";
//     });
//     document.body.appendChild(btnSair);
    
//     /* =============================
//        Loop de Animação
//        ============================= */
//     renderer.setAnimationLoop(() => {
//       renderer.render(scene, camera);
//     });
    
//     await mindarThree.start();
//   };
  
//   start();
// });
































// import { loadGLTF } from "./loader.js";

// const THREE = window.MINDAR.IMAGE.THREE;
// const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// // Imagens para a lixeira, uma para cada cor (ordem: amarelo, azul, verde, vermelho).
// const trashBinImages = [
//   "./gltf/imgs/me.jpg",
//   "./gltf/imgs/pa.jpg",
//   "./gltf/imgs/vi.jpg",
//   "./gltf/imgs/pla.jpg"
// ];

// // Imagens para as plaquinhas – para cada tipo (left, right, up) e para cada cor
// const plateImages = {
//   left: [
//     "./gltf/imgs/amarelo_left.png",
//     "./gltf/imgs/azul_left.png",
//     "./gltf/imgs/verde_left.png",
//     "./gltf/imgs/vermelho_left.png"
//   ],
//   right: [
//     "./gltf/imgs/amarelo_right.png",
//     "./gltf/imgs/azul_right.png",
//     "./gltf/imgs/verde_right.png",
//     "./gltf/imgs/vermelho_right.png"
//   ],
//   up: [
//     "./gltf/imgs/amarelo_up.png",
//     "./gltf/imgs/azul_up.png",
//     "./gltf/imgs/verde_up.png",
//     "./gltf/imgs/vermelho_up.png"
//   ]
// };

// // Lista de arquivos GLTF – a ordem é fundamental:
// // 0: y_left, 1: b_left, 2: g_left, 3: r_left,
// // 4: y_right, 5: b_right, 6: g_right, 7: r_right,
// // 8: y_up, 9: b_up, 10: g_up, 11: r_up,
// // 12: colete2, 13: recicle, 14: loop2, 15: loop3,
// // 16: loop2_molde, 17: loop3_molde.
// const modelFiles = [
//   "./gltf/amarelo_left.gltf", "./gltf/azul_left.gltf", "./gltf/verde_left.gltf", "./gltf/vermelho_left.gltf",
//   "./gltf/amarelo_right.gltf", "./gltf/azul_right.gltf", "./gltf/verde_right.gltf", "./gltf/vermelho_right.gltf",
//   "./gltf/amarelo_up.gltf", "./gltf/azul_up.gltf", "./gltf/verde_up.gltf", "./gltf/vermelho_up.gltf",
//   "./gltf/colete2.gltf", "./gltf/recicle.gltf", "./gltf/loop2.gltf", "./gltf/loop3.gltf",
//   "./gltf/loop2_molde.gltf", "./gltf/loop3_molde.gltf"
// ];

// // Mapeamento dos índices dos modelos para as plaquinhas de cada cor.
// // Ordem: 0: amarelo, 1: azul, 2: verde, 3: vermelho.
// const plateModelIndices = [
//   { left: 0, right: 4, up: 8 },    // Amarelo
//   { left: 1, right: 5, up: 9 },    // Azul
//   { left: 2, right: 6, up: 10 },   // Verde
//   { left: 3, right: 7, up: 11 }    // Vermelho
// ];

// document.addEventListener("DOMContentLoaded", () => {
//   const start = async () => {
//     // Instancia o MindAR e extrai scene, camera e renderer
//     const mindarThree = new window.MINDAR.IMAGE.MindARThree({
//       container: document.body,
//       imageTargetSrc: "./p2_papel.mind"
//     });
//     const { scene, camera, renderer } = mindarThree;

//     // Adiciona iluminação
//     const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
//     scene.add(light);

//     // Carrega os modelos 3D
//     const models = [];
//     for (let i = 0; i < modelFiles.length; i++) {
//       const gltf = await loadGLTF(modelFiles[i]);
//       models.push(gltf);
//     }

//     // Define posições "nativas" para os templates (não exibidos)
//     const nativePositions = [
//       [ -0.8,  0.8, 0], [ -0.4,  0.8, 0], [ 0,  0.8, 0], [ 0.4,  0.8, 0],
//       [ -0.8,  0.2, 0], [ -0.4,  0.2, 0], [ 0,  0.2, 0], [ 0.4,  0.2, 0],
//       [ -0.8, -0.4, 0], [ -0.4, -0.4, 0], [ 0, -0.4, 0], [ 0.4, -0.4, 0],
//       [ -0.8, -1.0, 0], [ -0.4, -1.0, 0], [ 0, -1.0, 0], [ 0.4, -1.0, 0],
//       [0, 0, 0], [0, 0, 0]
//     ];

//     // Configura os modelos nativos (templates)
//     models.forEach((m, i) => {
//       m.scene.scale.set(0.13, 0.13, 0.13);
//       m.scene.userData.originalScale = m.scene.scale.clone();
//       m.scene.position.set(...(nativePositions[i] || [0, 0, 0]));
//       m.scene.userData.originalPosition = m.scene.position.clone();
//       m.scene.userData.originalRotation = m.scene.rotation.clone();
//       m.scene.userData.clickable = true;
//       if (i >= 8 && i < 12) {
//         m.scene.userData.rotatable = true;
//         m.scene.userData.targetRotation = m.scene.rotation.z;
//       } else {
//         m.scene.userData.rotatable = false;
//       }
//       m.scene.userData.isClone = false;
//     });

//     // Adiciona os modelos nativos a âncoras AR e os torna invisíveis (serão usados apenas para clonagem)
//     const anchors = models.map(m => {
//       const anchor = mindarThree.addAnchor(0);
//       anchor.group.add(m.scene);
//       return anchor;
//     });
//     models.forEach(m => m.scene.visible = false);

//     // Salva referências globais
//     window._models = models;
//     window._anchors = anchors;
//     window._scene = scene;
//     window._mindarThree = mindarThree;

//     // ===================== GRUPOS E FUNÇÕES =====================

//     // Grupo para os clones interativos (filhos)
//     const childGroup = new THREE.Group();
//     scene.add(childGroup);

//     // Grupo para a paleta (placeholders) – fixado à câmera para permanecer no lado direito
//     const paletteGroup = new THREE.Group();
//     paletteGroup.name = "paletteGroup";
//     // Posiciona a paleta no canto direito; ajuste estes valores conforme necessário
//     paletteGroup.position.set(0.8, 0, -1);
//     camera.add(paletteGroup);

//     // Variável global para controlar a cor atual (0: amarelo, 1: azul, 2: verde, 3: vermelho)
//     let currentColorIndex = 0;

//     // Cria um objeto de paleta 3D (placeholder) para um determinado tipo ("left", "right" ou "up")
//     function createPaletteObject(type) {
//       const modelIndex = plateModelIndices[currentColorIndex][type];
//       const original = window._models[modelIndex].scene;
//       const paletteObj = original.clone();
//       paletteObj.visible = true;
//       // Configura o objeto para ser clicável, mas não arrastável (apenas serve para gerar clones)
//       paletteObj.userData = {
//         clickable: true,
//         isPalette: true,
//         rotatable: original.userData.rotatable,
//         targetRotation: original.userData.targetRotation,
//         originalScale: original.userData.originalScale.clone(),
//         originalPosition: original.userData.originalPosition.clone(),
//         originalRotation: original.userData.originalRotation.clone()
//       };
//       return paletteObj;
//     }

//     // Atualiza a UI da paleta 3D: remove os objetos antigos e adiciona os placeholders para cada tipo
//     function updatePaletteUI() {
//       paletteGroup.clear();
//       const paletteLeft = createPaletteObject("left");
//       paletteLeft.position.set(0, 0.3, 0);
//       paletteGroup.add(paletteLeft);

//       const paletteRight = createPaletteObject("right");
//       paletteRight.position.set(0, 0, 0);
//       paletteGroup.add(paletteRight);

//       const paletteUp = createPaletteObject("up");
//       paletteUp.position.set(0, -0.3, 0);
//       paletteGroup.add(paletteUp);
//     }
//     updatePaletteUI();

//     // Função para criar um clone interativo (filho) a partir de um objeto (placeholder ou já clonado)
//     function addChildClone(fromObject) {
//       const clone = fromObject.clone();
//       clone.visible = true;
//       clone.userData = {
//         clickable: true,
//         isClone: true,
//         rotatable: fromObject.userData.rotatable,
//         targetRotation: fromObject.userData.targetRotation,
//         originalScale: fromObject.userData.originalScale.clone(),
//         originalPosition: fromObject.userData.originalPosition.clone(),
//         originalRotation: fromObject.userData.originalRotation.clone()
//       };
//       // Aplica um pequeno offset para diferenciar visualmente do objeto pai
//       clone.position.x += 0.1;
//       clone.position.y -= 0.1;
//       childGroup.add(clone);
//     }

//     // ===================== INTERAÇÃO GLOBAL (DRAG, CLONAGEM, REMOÇÃO) =====================
//     let draggingModel = null;
//     let globalInitialPointer = new THREE.Vector2();
//     let globalInitialPosition = new THREE.Vector3();
//     let isDragging = false;
//     let currentTapObject = null;
//     let tapTimer = null;
//     let tapCount = 0;
//     const TAP_DELAY = 300;

//     function onPointerDown(e) {
//       if (
//         e.target.closest("#uiContainerBottom") ||
//         e.target.closest(".corner-btn") ||
//         e.target.closest(".top-btn")
//       )
//         return;
//       isDragging = false;
//       const clientX = e.clientX || (e.touches && e.touches[0].clientX);
//       const clientY = e.clientY || (e.touches && e.touches[0].clientY);
//       globalInitialPointer.set(clientX, clientY);
//       const pointerVec = new THREE.Vector2(
//         (clientX / window.innerWidth) * 2 - 1,
//         -(clientY / window.innerHeight) * 2 + 1
//       );
//       const raycaster = new THREE.Raycaster();
//       raycaster.setFromCamera(pointerVec, camera);
//       const intersects = raycaster.intersectObjects(scene.children, true);
//       if (intersects.length > 0) {
//         let obj = intersects[0].object;
//         while (obj.parent && !obj.userData.clickable) {
//           obj = obj.parent;
//         }
//         if (obj.userData.clickable) {
//           // Se for objeto da paleta, clone imediatamente (não é arrastável)
//           if (obj.userData.isPalette) {
//             addChildClone(obj);
//             return;
//           }
//           draggingModel = obj;
//           currentTapObject = obj;
//           globalInitialPosition.copy(obj.position);
//         }
//       }
//     }

//     function onPointerMove(e) {
//       if (!draggingModel) return;
//       const clientX = e.clientX || (e.touches && e.touches[0].clientX);
//       const clientY = e.clientY || (e.touches && e.touches[0].clientY);
//       const dx = clientX - globalInitialPointer.x;
//       const dy = clientY - globalInitialPointer.y;
//       if (Math.sqrt(dx * dx + dy * dy) > 5) {
//         isDragging = true;
//       }
//       if (isDragging) {
//         const deltaX = dx * 0.002575;
//         const deltaY = dy * -0.002575;
//         draggingModel.position.set(
//           globalInitialPosition.x + deltaX,
//           globalInitialPosition.y + deltaY,
//           globalInitialPosition.z
//         );
//       }
//     }

//     function onPointerUp(e) {
//       if (!isDragging && currentTapObject) {
//         tapCount++;
//         tapTimer = setTimeout(() => {
//           if (tapCount === 2) {
//             // Duplo-clique: se o objeto não for da paleta, gera um clone interativo
//             if (!currentTapObject.userData.isPalette) {
//               addChildClone(currentTapObject);
//               console.log("Clone gerado (duplo-clique)");
//             }
//           } else if (tapCount >= 3) {
//             // Triple-clique: remove o clone interativo (se aplicável)
//             if (currentTapObject.userData.isClone) {
//               if (currentTapObject.parent) {
//                 currentTapObject.parent.remove(currentTapObject);
//                 console.log("Clone removido (triple-clique)");
//               }
//             }
//           }
//           tapCount = 0;
//           currentTapObject = null;
//         }, TAP_DELAY);
//       }
//       draggingModel = null;
//     }

//     document.body.addEventListener("pointerdown", onPointerDown);
//     document.body.addEventListener("pointermove", onPointerMove);
//     document.body.addEventListener("pointerup", onPointerUp);
//     document.body.addEventListener("touchstart", onPointerDown);
//     document.body.addEventListener("touchmove", onPointerMove);
//     document.body.addEventListener("touchend", onPointerUp);

//     // ===================== BOTÕES DE UI (Sair, Mandala, Zoom, Reset) =====================
//     // Botão Sair (canto superior esquerdo)
//     const btnSair = document.createElement("img");
//     btnSair.src = "./gltf/imgs/sair.png";
//     btnSair.alt = "Sair";
//     btnSair.style.cursor = "pointer";
//     btnSair.style.height = isMobile ? "40px" : "50px";
//     btnSair.style.width = "auto";
//     btnSair.style.position = "absolute";
//     btnSair.style.top = "10px";
//     btnSair.style.left = "10px";
//     btnSair.addEventListener("click", (e) => {
//       e.stopPropagation();
//       window.location.href = "https://shakmatton.github.io/unireality";
//     });
//     document.body.appendChild(btnSair);

//     // Botão Mandala (canto superior direito) – altera a cor atual e atualiza a paleta e a imagem da lixeira
//     let mandalaTapCount = 0;
//     let mandalaTapTimer = null;
//     let mandalaRotation = 0;
//     const btnMandala = document.createElement("img");
//     btnMandala.src = "./gltf/imgs/mandala.jpg";
//     btnMandala.alt = "Mandala";
//     btnMandala.style.cursor = "pointer";
//     btnMandala.style.height = isMobile ? "40px" : "40px";
//     btnMandala.style.width = "auto";
//     btnMandala.style.position = "absolute";
//     btnMandala.style.top = "10px";
//     btnMandala.style.right = "10px";
//     btnMandala.style.transition = "transform 0.3s ease";
//     btnMandala.addEventListener("pointerdown", (e) => { e.stopPropagation(); });
//     btnMandala.addEventListener("pointerup", (e) => {
//       e.stopPropagation();
//       mandalaTapCount++;
//       if (mandalaTapCount === 1) {
//         mandalaTapTimer = setTimeout(() => {
//           mandalaRotation += 90;
//           btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
//           currentColorIndex = (currentColorIndex + 1) % 4;
//           updatePaletteUI();
//           trashBinImg.src = trashBinImages[currentColorIndex];
//           trashBinImg.style.display = "block";
//           mandalaTapCount = 0;
//         }, 0);
//       } else if (mandalaTapCount === 2) {
//         clearTimeout(mandalaTapTimer);
//         mandalaRotation -= 90;
//         btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
//         currentColorIndex = (currentColorIndex + 1) % 4;
//         updatePaletteUI();
//         trashBinImg.src = trashBinImages[currentColorIndex];
//         trashBinImg.style.display = "block";
//         mandalaTapCount = 0;
//       }
//     });
//     document.body.appendChild(btnMandala);

//     // Botões de zoom e reset (UI inferior)
//     const uiContainerBottom = document.createElement("div");
//     uiContainerBottom.id = "uiContainerBottom";
//     uiContainerBottom.style.position = "absolute";
//     uiContainerBottom.style.bottom = "20px";
//     uiContainerBottom.style.left = "50%";
//     uiContainerBottom.style.transform = "translateX(-50%)";
//     uiContainerBottom.style.display = "flex";
//     uiContainerBottom.style.gap = "10px";
//     uiContainerBottom.style.zIndex = "1000";
//     uiContainerBottom.style.pointerEvents = "auto";
//     document.body.appendChild(uiContainerBottom);

//     function zoomIn() {
//       scene.traverse(child => {
//         if (child.userData && child.userData.originalScale) {
//           child.scale.multiplyScalar(1.1);
//         }
//       });
//     }
//     function zoomOut() {
//       scene.traverse(child => {
//         if (child.userData && child.userData.originalScale) {
//           child.scale.multiplyScalar(0.9);
//         }
//       });
//     }
//     function zoomOriginal() {
//       scene.traverse(child => {
//         if (child.userData && child.userData.originalScale) {
//           child.position.copy(child.userData.originalPosition);
//           child.rotation.copy(child.userData.originalRotation);
//           child.scale.copy(child.userData.originalScale);
//           if (child.userData.rotatable) {
//             child.userData.targetRotation = child.userData.originalRotation.z;
//           }
//         }
//       });
//       childGroup.clear();
//     }

//     const btnZoomOriginal = document.createElement("img");
//     btnZoomOriginal.src = "./gltf/imgs/home.png";
//     btnZoomOriginal.alt = "Zoom Original";
//     btnZoomOriginal.style.cursor = "pointer";
//     btnZoomOriginal.style.width = isMobile ? "32px" : "35px";
//     btnZoomOriginal.style.height = isMobile ? "32px" : "35px";
//     btnZoomOriginal.addEventListener("click", (e) => {
//       e.stopPropagation();
//       zoomOriginal();
//     });
//     uiContainerBottom.appendChild(btnZoomOriginal);

//     const btnZoomPlus = document.createElement("img");
//     btnZoomPlus.src = "./gltf/imgs/plus.jpg";
//     btnZoomPlus.alt = "Zoom+";
//     btnZoomPlus.style.cursor = "pointer";
//     btnZoomPlus.style.width = isMobile ? "32px" : "35px";
//     btnZoomPlus.style.height = isMobile ? "32px" : "35px";
//     btnZoomPlus.addEventListener("click", (e) => {
//       e.stopPropagation();
//       zoomIn();
//     });
//     uiContainerBottom.appendChild(btnZoomPlus);

//     const btnZoomMinus = document.createElement("img");
//     btnZoomMinus.src = "./gltf/imgs/minus.jpg";
//     btnZoomMinus.alt = "Zoom-";
//     btnZoomMinus.style.cursor = "pointer";
//     btnZoomMinus.style.width = isMobile ? "32px" : "35px";
//     btnZoomMinus.style.height = isMobile ? "32px" : "35px";
//     btnZoomMinus.addEventListener("click", (e) => {
//       e.stopPropagation();
//       zoomOut();
//     });
//     uiContainerBottom.appendChild(btnZoomMinus);

//     const btnOnOff = document.createElement("img");
//     btnOnOff.src = "./gltf/imgs/off.jpg";
//     btnOnOff.alt = "ON/OFF";
//     btnOnOff.style.cursor = "pointer";
//     btnOnOff.style.height = isMobile ? "32px" : "35px";
//     btnOnOff.style.width = "auto";
//     btnOnOff.addEventListener("click", (e) => {
//       e.stopPropagation();
//       scene.traverse(child => {
//         if (child.userData && child.userData.clickable) {
//           child.visible = !child.visible;
//         }
//       });
//       btnOnOff.src = btnOnOff.src === "./gltf/imgs/off.jpg" ? "./gltf/imgs/on.jpg" : "./gltf/imgs/off.jpg";
//     });
//     uiContainerBottom.appendChild(btnOnOff);

//     const btnReset = document.createElement("img");
//     btnReset.src = "./gltf/imgs/reset.jpg";
//     btnReset.alt = "Reset";
//     btnReset.style.cursor = "pointer";
//     btnReset.style.height = isMobile ? "32px" : "35px";
//     btnReset.style.width = "auto";
//     btnReset.addEventListener("click", (e) => {
//       e.stopPropagation();
//       scene.traverse(child => {
//         if (child.userData && child.userData.originalScale) {
//           child.position.copy(child.userData.originalPosition);
//           child.rotation.copy(child.userData.originalRotation);
//           child.scale.copy(child.userData.originalScale);
//           if (child.userData.rotatable) {
//             child.userData.targetRotation = child.userData.originalRotation.z;
//           }
//         }
//       });
//       childGroup.clear();
//     });
//     uiContainerBottom.appendChild(btnReset);

//     // ===================== LOOP DE ANIMAÇÃO =====================
//     renderer.setAnimationLoop(() => {
//       // Atualiza a rotação suave dos modelos nativos (templates), se aplicável
//       window._models.forEach(model => {
//         if (model.scene.userData.rotatable) {
//           const current = model.scene.rotation.z;
//           const target = model.scene.userData.targetRotation;
//           const diff = target - current;
//           if (Math.abs(diff) > 0.01) {
//             model.scene.rotation.z += diff * 0.1;
//           } else {
//             model.scene.rotation.z = target;
//           }
//         }
//       });
//       renderer.render(window._scene, camera);
//     });

//     // Elemento da lixeira (imagem) – permanece fixo no canto direito superior
//     const trashBinImg = document.createElement("img");
//     trashBinImg.alt = "Lixeira";
//     trashBinImg.style.position = "absolute";
//     trashBinImg.style.top = isMobile ? "60px" : "80px";
//     trashBinImg.style.right = "10px";
//     trashBinImg.style.width = "40px";
//     trashBinImg.style.height = "auto";
//     trashBinImg.style.display = "none";
//     document.body.appendChild(trashBinImg);

//     // Inicia a experiência AR
//     await window._mindarThree.start();
//   };

//   start();
// });