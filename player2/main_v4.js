import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Imagens para lixeiras (ordem: Vermelha, Verde, Azul, Amarela)
const trashBinImages = [
  "./gltf/imgs/pla.jpg",    // Vermelha
  "./gltf/imgs/vi.jpg",     // Verde
  "./gltf/imgs/pa.jpg",     // Azul
  "./gltf/imgs/me.jpg"      // Amarela
];
let currentColorIndex = -1; // Controla a cor atual para Mandala

// Mapping das plaquinhas – para 4 cores; cada uma com 3 tipos (ordem: left, right, up)
const platesMapping = {
  0: { left: "./gltf/imgs/vermelho_left.png", right: "./gltf/imgs/vermelho_right.png", up: "./gltf/imgs/vermelho_up.png" },
  1: { left: "./gltf/imgs/verde_left.png",    right: "./gltf/imgs/verde_right.png",    up: "./gltf/imgs/verde_up.png"    },
  2: { left: "./gltf/imgs/azul_left.png",     right: "./gltf/imgs/azul_right.png",     up: "./gltf/imgs/azul_up.png"     },
  3: { left: "./gltf/imgs/amarelo_left.png",  right: "./gltf/imgs/amarelo_right.png",  up: "./gltf/imgs/amarelo_up.png"  }
};

// Mapping para determinar qual modelo corresponde a cada plaquinha
const plateModelIndices = {
  0: { left: 3, right: 7, up: 11 },
  1: { left: 2, right: 6, up: 10 },
  2: { left: 1, right: 5, up: 9  },
  3: { left: 0, right: 4, up: 8  }
};

// Posições fixas para os objetos PRIME (para as categorias do menu)
const primePositions = {
  recicle: new THREE.Vector3(1.0, 0.5, 0),
  colete: new THREE.Vector3(1.0, 0.0, 0),
  loop2: new THREE.Vector3(1.0, -0.5, 0),
  loop3: new THREE.Vector3(1.0, -1.0, 0)
};

// Grupos para gerenciar os PRIME e os FILHOS
const primeObjects = {}; // Ex: primeObjects.recicle, primeObjects.colete, etc.
const childGroup = new THREE.Group();
  
document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    // Instancia o MindAR
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./p2_papel.mind"
    });
    const { scene, camera, renderer } = mindarThree;
    
    // Iluminação
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    // --- Carregamento dos modelos 3D ---
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
    
    // Ordem dos modelos (índices 0 a 15):
    const models = [
      y_left, b_left, g_left, r_left,
      y_right, b_right, g_right, r_right,
      y_up, b_up, g_up, r_up,
      colete2, recicle, loop2_molde, loop3_molde
    ];
    
    // As posições dos nativos (eles não serão mostrados)
    const positions = [
      [0, 0, 0], [0.2, 0.2, 0], [-0.2, -0.2, 0], [0.2, -0.2, 0],
      [0.1, 0.1, 0], [0.3, 0.3, 0], [-0.3, -0.3, 0], [0.3, -0.3, 0],
      [0.4, 0.4, 0], [0.6, 0.6, 0], [-0.6, -0.6, 0], [0.6, -0.6, 0],
      [-0.1, -0.1, 0], [-0.4, -0.4, 0], [-0.5, -0.5, 0], [0.5, -0.5, 0]
    ];
    
    // Configura os modelos nativos e os torna invisíveis
    models.forEach((model, i) => {
      model.scene.scale.set(0.13, 0.13, 0.13);
      model.scene.userData.originalScale = model.scene.scale.clone();
      model.scene.position.set(...positions[i]);
      model.scene.userData.originalPosition = model.scene.position.clone();
      model.scene.userData.originalRotation = model.scene.rotation.clone();
      model.scene.userData.clickable = true;
      if (i >= 8 && i < 12) {
        model.scene.userData.rotatable = true;
        model.scene.userData.targetRotation = model.scene.rotation.z;
      } else {
        model.scene.userData.rotatable = false;
      }
      // Marque como nativo
      model.scene.userData.isClone = false;
    });
    
    // Adiciona os nativos às âncoras, mas os torna invisíveis
    const anchors = models.map(model => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(model.scene);
      return anchor;
    });
    models.forEach(model => model.scene.visible = false);
    
    // Cria um grupo para os clones FILHOS (nascidos a partir de PRIME)
    scene.add(childGroup);
    
    // --- FUNÇÃO PARA CRIAR UM OBJETO PRIME ---
    // O PRIME é criado clonando o modelo nativo correspondente e reposicionado para uma posição fixa (primePositions)
    function createPrime(modelIndex, category) {
      const original = models[modelIndex].scene;
      const prime = original.clone();
      prime.visible = true;
      prime.userData = {
        clickable: false, // PRIME não é arrastável; serve só como base
        rotatable: original.userData.rotatable,
        targetRotation: original.userData.targetRotation,
        originalScale: original.userData.originalScale.clone(),
        originalPosition: original.userData.originalPosition.clone(),
        originalRotation: original.userData.originalRotation.clone(),
        isPrime: true
      };
      // Posiciona o PRIME na posição fixa definida para sua categoria
      if (primePositions[category]) {
        prime.position.copy(primePositions[category]);
      } else {
        // Caso não haja posição definida, usa a posição original
        prime.position.copy(original.position);
      }
      // Adiciona à âncora do modelo original
      anchors[modelIndex].group.add(prime);
      primeObjects[category] = prime;
      return prime;
    }
    
    // --- FUNÇÃO PARA CRIAR UM FILHO (clone interativo) a partir de um PRIME ou FILHO existente ---
    function addChildClone(fromObject) {
      const clone = fromObject.clone();
      clone.visible = true;
      clone.userData = {
        clickable: true,
        rotatable: fromObject.userData.rotatable,
        targetRotation: fromObject.userData.targetRotation,
        originalScale: fromObject.userData.originalScale.clone(),
        originalPosition: fromObject.userData.originalPosition.clone(),
        originalRotation: fromObject.userData.originalRotation.clone(),
        isClone: true
      };
      // Aplica um pequeno offset para visualmente separar o filho
      clone.position.x += 0.1;
      clone.position.y -= 0.1;
      childGroup.add(clone);
    }
    
    // --- MENU LATERAL (ícones do lado direito) ---
    const menuContainer = document.createElement("div");
    menuContainer.style.position = "absolute";
    menuContainer.style.top = "100px";
    menuContainer.style.right = "10px";
    menuContainer.style.display = "flex";
    menuContainer.style.flexDirection = "column";
    menuContainer.style.gap = "10px";
    document.body.appendChild(menuContainer);
    
    // Ícone Recicle
    const recicleIcon = document.createElement("img");
    recicleIcon.src = "./gltf/imgs/recicle.png";
    recicleIcon.alt = "Recicle";
    recicleIcon.style.width = "40px";
    recicleIcon.style.height = "auto";
    recicleIcon.style.cursor = "pointer";
    recicleIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!primeObjects.recicle) {
        createPrime(13, "recicle");
      }
    });
    menuContainer.appendChild(recicleIcon);
    
    // Ícone Colete
    const coleteIcon = document.createElement("img");
    coleteIcon.src = "./gltf/imgs/colete.png";
    coleteIcon.alt = "Colete";
    coleteIcon.style.width = "40px";
    coleteIcon.style.height = "auto";
    coleteIcon.style.cursor = "pointer";
    coleteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!primeObjects.colete) {
        createPrime(12, "colete");
      }
    });
    menuContainer.appendChild(coleteIcon);
    
    // Ícone Loop2_molde
    const loop2Icon = document.createElement("img");
    loop2Icon.src = "./gltf/imgs/loop-2.png";
    loop2Icon.alt = "Loop 2";
    loop2Icon.style.width = "40px";
    loop2Icon.style.height = "auto";
    loop2Icon.style.cursor = "pointer";
    loop2Icon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!primeObjects.loop2) {
        createPrime(14, "loop2");
      }
    });
    menuContainer.appendChild(loop2Icon);
    
    // Ícone Loop3_molde
    const loop3Icon = document.createElement("img");
    loop3Icon.src = "./gltf/imgs/loop-3.png";
    loop3Icon.alt = "Loop 3";
    loop3Icon.style.width = "40px";
    loop3Icon.style.height = "auto";
    loop3Icon.style.cursor = "pointer";
    loop3Icon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!primeObjects.loop3) {
        createPrime(15, "loop3");
      }
    });
    menuContainer.appendChild(loop3Icon);
    
    // --- Área de Plaquinhas (abaixo da lixeira) ---
    const platesForTrashContainer = document.createElement("div");
    platesForTrashContainer.style.position = "absolute";
    platesForTrashContainer.style.top = "125px";
    platesForTrashContainer.style.right = "10px";
    platesForTrashContainer.style.display = "flex";
    platesForTrashContainer.style.flexDirection = "column";
    platesForTrashContainer.style.alignItems = "center";
    platesForTrashContainer.style.gap = "5px";
    document.body.appendChild(platesForTrashContainer);
    
    function updatePlatesForTrash() {
      platesForTrashContainer.innerHTML = "";
      if (currentColorIndex === -1) return;
      // Cria 3 ícones na ordem: left, right, up
      const plateTypes = ['left', 'right', 'up'];
      plateTypes.forEach(type => {
        const plateImg = document.createElement("img");
        plateImg.src = platesMapping[currentColorIndex][type];
        plateImg.alt = `Placa ${type}`;
        plateImg.style.width = isMobile ? "41px" : "40px";
        plateImg.style.cursor = "pointer";
        // Cada ícone gera um filho diretamente ao ser clicado
        plateImg.addEventListener("click", (e) => {
          e.stopPropagation();
          addChildClone(primeObjects.plates || createPrime( plateModelIndices[currentColorIndex].up, "plates" ));
        });
        platesForTrashContainer.appendChild(plateImg);
      });
    }
    
    // --- Botões de UI (inferior) ---
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
      scene.traverse(child => {
        if (child.userData?.originalScale) {
          child.scale.multiplyScalar(1.1);
        }
      });
    }
    function zoomOut() {
      scene.traverse(child => {
        if (child.userData?.originalScale) {
          child.scale.multiplyScalar(0.9);
        }
      });
    }
    function zoomOriginal() {
      scene.traverse(child => {
        if (child.userData?.originalScale) {
          child.scale.copy(child.userData.originalScale);
        }
      });
      // Opcional: remover FILHOS (não PRIME)
      childGroup.clear();
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
      scene.traverse(child => {
        if (child.userData?.originalScale) {
          child.visible = objetosVisiveis;
        }
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
      // Reseta a cena: reposiciona e redefine escala e rotação de todos os objetos interativos
      scene.traverse(child => {
        if (child.userData?.originalScale) {
          child.position.copy(child.userData.originalPosition);
          child.rotation.copy(child.userData.originalRotation);
          child.scale.copy(child.userData.originalScale);
          if (child.userData.rotatable) {
            child.userData.targetRotation = child.userData.originalRotation.z;
          }
        }
      });
      childGroup.clear();
      // Remove os PRIME
      Object.keys(primeObjects).forEach(key => {
        if (primeObjects[key] && primeObjects[key].parent) {
          primeObjects[key].parent.remove(primeObjects[key]);
          primeObjects[key] = null;
        }
      });
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
        }, 0); // Atualização imediata
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
    
    // --- INTERAÇÃO GLOBAL (DRAG, ROTATION, TAP) ---
    let draggingModel = null;
    let initialPointer = new THREE.Vector2();
    let initialPosition = new THREE.Vector3();
    let isDragging = false;
    let currentTapObject = null;
    let tapTimer = null;
    let tapCount = 0;
    const TAP_DELAY = 300;
    
    function onPointerDown(e) {
      if (e.target.closest("#uiContainerBottom") ||
          e.target.closest("#platesForTrashContainer") ||
          e.target.closest(".corner-btn") ||
          e.target.closest(".top-btn"))
        return;
      isDragging = false;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      initialPointer.set(clientX, clientY);
      const pointerVec = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointerVec, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.clickable) {
          obj = obj.parent;
        }
        if (obj.userData.clickable) {
          draggingModel = obj;
          currentTapObject = obj;
          initialPosition.copy(obj.position);
        }
      }
    }
    
    function onPointerMove(e) {
      if (!draggingModel) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = clientX - initialPointer.x;
      const dy = clientY - initialPointer.y;
      if (Math.sqrt(dx*dx + dy*dy) > 5) {
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
        tapCount++;
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            if (tapCount === 2) {
              // Duplo-click: se o objeto for PRIME, gera um filho clone
              if (currentTapObject.userData.isPrime) {
                addChildClone(currentTapObject);
                console.log("Filho gerado (duplo-click sobre PRIME)");
              }
            } else if (tapCount >= 3) {
              // Triple-click: se o objeto for filho, remove-o
              if (currentTapObject.userData.isClone) {
                if (currentTapObject.parent) {
                  currentTapObject.parent.remove(currentTapObject);
                  console.log("Filho removido (triple-click)");
                }
              }
            }
            tapCount = 0;
            currentTapObject = null;
          }, TAP_DELAY);
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
    
    // --- LOOP DE ANIMAÇÃO (para rotacionar os objetos "up") ---
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
})