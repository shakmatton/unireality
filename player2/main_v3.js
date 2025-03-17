import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Imagens para a lixeira, uma para cada cor (ordem: amarelo, azul, verde, vermelho).
const trashBinImages = [
  "./gltf/imgs/me.jpg",
  "./gltf/imgs/pa.jpg",
  "./gltf/imgs/vi.jpg",
  "./gltf/imgs/pla.jpg"
];

// Imagens para as plaquinhas – para cada tipo (left, right, up) e para cada cor
const plateImages = {
  left: [
    "./gltf/imgs/amarelo_left.png",
    "./gltf/imgs/azul_left.png",
    "./gltf/imgs/verde_left.png",
    "./gltf/imgs/vermelho_left.png"
  ],
  right: [
    "./gltf/imgs/amarelo_right.png",
    "./gltf/imgs/azul_right.png",
    "./gltf/imgs/verde_right.png",
    "./gltf/imgs/vermelho_right.png"
  ],
  up: [
    "./gltf/imgs/amarelo_up.png",
    "./gltf/imgs/azul_up.png",
    "./gltf/imgs/verde_up.png",
    "./gltf/imgs/vermelho_up.png"
  ]
};

// Lista de arquivos GLTF – a ordem é fundamental:
// 0: y_left, 1: b_left, 2: g_left, 3: r_left,
// 4: y_right, 5: b_right, 6: g_right, 7: r_right,
// 8: y_up, 9: b_up, 10: g_up, 11: r_up,
// 12: colete2, 13: recicle, 14: loop2, 15: loop3,
// 16: loop2_molde, 17: loop3_molde.
const modelFiles = [
  "./gltf/amarelo_left.gltf", "./gltf/azul_left.gltf", "./gltf/verde_left.gltf", "./gltf/vermelho_left.gltf",
  "./gltf/amarelo_right.gltf", "./gltf/azul_right.gltf", "./gltf/verde_right.gltf", "./gltf/vermelho_right.gltf",
  "./gltf/amarelo_up.gltf", "./gltf/azul_up.gltf", "./gltf/verde_up.gltf", "./gltf/vermelho_up.gltf",
  "./gltf/colete2.gltf", "./gltf/recicle.gltf", "./gltf/loop2.gltf", "./gltf/loop3.gltf",
  "./gltf/loop2_molde.gltf", "./gltf/loop3_molde.gltf"
];

// Mapeamento dos índices dos modelos para as plaquinhas de cada cor.
// Ordem: 0: amarelo, 1: azul, 2: verde, 3: vermelho.
const plateModelIndices = [
  { left: 0, right: 4, up: 8 },    // Amarelo
  { left: 1, right: 5, up: 9 },    // Azul
  { left: 2, right: 6, up: 10 },   // Verde
  { left: 3, right: 7, up: 11 }    // Vermelho
];

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    // Instancia o MindAR e extrai scene, camera e renderer
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./p2_papel.mind"
    });
    const { scene, camera, renderer } = mindarThree;

    // Adiciona iluminação
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Carrega os modelos 3D
    const models = [];
    for (let i = 0; i < modelFiles.length; i++) {
      const gltf = await loadGLTF(modelFiles[i]);
      models.push(gltf);
    }

    // Define posições "nativas" para os templates (não exibidos)
    const nativePositions = [
      [ -0.8,  0.8, 0], [ -0.4,  0.8, 0], [ 0,  0.8, 0], [ 0.4,  0.8, 0],
      [ -0.8,  0.2, 0], [ -0.4,  0.2, 0], [ 0,  0.2, 0], [ 0.4,  0.2, 0],
      [ -0.8, -0.4, 0], [ -0.4, -0.4, 0], [ 0, -0.4, 0], [ 0.4, -0.4, 0],
      [ -0.8, -1.0, 0], [ -0.4, -1.0, 0], [ 0, -1.0, 0], [ 0.4, -1.0, 0],
      [0, 0, 0], [0, 0, 0]
    ];

    // Configura os modelos nativos (templates)
    models.forEach((m, i) => {
      m.scene.scale.set(0.13, 0.13, 0.13);
      m.scene.userData.originalScale = m.scene.scale.clone();
      m.scene.position.set(...(nativePositions[i] || [0, 0, 0]));
      m.scene.userData.originalPosition = m.scene.position.clone();
      m.scene.userData.originalRotation = m.scene.rotation.clone();
      m.scene.userData.clickable = true;
      if (i >= 8 && i < 12) {
        m.scene.userData.rotatable = true;
        m.scene.userData.targetRotation = m.scene.rotation.z;
      } else {
        m.scene.userData.rotatable = false;
      }
      m.scene.userData.isClone = false;
    });

    // Adiciona os modelos nativos a âncoras AR e os torna invisíveis (serão usados apenas para clonagem)
    const anchors = models.map(m => {
      const anchor = mindarThree.addAnchor(0);
      anchor.group.add(m.scene);
      return anchor;
    });
    models.forEach(m => m.scene.visible = false);

    // Salva referências globais
    window._models = models;
    window._anchors = anchors;
    window._scene = scene;
    window._mindarThree = mindarThree;

    // ===================== GRUPOS E FUNÇÕES =====================

    // Grupo para os clones interativos (filhos)
    const childGroup = new THREE.Group();
    scene.add(childGroup);

    // Grupo para a paleta (placeholders) – fixado à câmera para permanecer no lado direito
    const paletteGroup = new THREE.Group();
    paletteGroup.name = "paletteGroup";
    // Posiciona a paleta no canto direito; ajuste estes valores conforme necessário
    paletteGroup.position.set(0.8, 0, -1);
    camera.add(paletteGroup);

    // Variável global para controlar a cor atual (0: amarelo, 1: azul, 2: verde, 3: vermelho)
    let currentColorIndex = 0;

    // Cria um objeto de paleta 3D (placeholder) para um determinado tipo ("left", "right" ou "up")
    function createPaletteObject(type) {
      const modelIndex = plateModelIndices[currentColorIndex][type];
      const original = window._models[modelIndex].scene;
      const paletteObj = original.clone();
      paletteObj.visible = true;
      // Configura o objeto para ser clicável, mas não arrastável (apenas serve para gerar clones)
      paletteObj.userData = {
        clickable: true,
        isPalette: true,
        rotatable: original.userData.rotatable,
        targetRotation: original.userData.targetRotation,
        originalScale: original.userData.originalScale.clone(),
        originalPosition: original.userData.originalPosition.clone(),
        originalRotation: original.userData.originalRotation.clone()
      };
      return paletteObj;
    }

    // Atualiza a UI da paleta 3D: remove os objetos antigos e adiciona os placeholders para cada tipo
    function updatePaletteUI() {
      paletteGroup.clear();
      const paletteLeft = createPaletteObject("left");
      paletteLeft.position.set(0, 0.3, 0);
      paletteGroup.add(paletteLeft);

      const paletteRight = createPaletteObject("right");
      paletteRight.position.set(0, 0, 0);
      paletteGroup.add(paletteRight);

      const paletteUp = createPaletteObject("up");
      paletteUp.position.set(0, -0.3, 0);
      paletteGroup.add(paletteUp);
    }
    updatePaletteUI();

    // Função para criar um clone interativo (filho) a partir de um objeto (placeholder ou já clonado)
    function addChildClone(fromObject) {
      const clone = fromObject.clone();
      clone.visible = true;
      clone.userData = {
        clickable: true,
        isClone: true,
        rotatable: fromObject.userData.rotatable,
        targetRotation: fromObject.userData.targetRotation,
        originalScale: fromObject.userData.originalScale.clone(),
        originalPosition: fromObject.userData.originalPosition.clone(),
        originalRotation: fromObject.userData.originalRotation.clone()
      };
      // Aplica um pequeno offset para diferenciar visualmente do objeto pai
      clone.position.x += 0.1;
      clone.position.y -= 0.1;
      childGroup.add(clone);
    }

    // ===================== INTERAÇÃO GLOBAL (DRAG, CLONAGEM, REMOÇÃO) =====================
    let draggingModel = null;
    let globalInitialPointer = new THREE.Vector2();
    let globalInitialPosition = new THREE.Vector3();
    let isDragging = false;
    let currentTapObject = null;
    let tapTimer = null;
    let tapCount = 0;
    const TAP_DELAY = 300;

    function onPointerDown(e) {
      if (
        e.target.closest("#uiContainerBottom") ||
        e.target.closest(".corner-btn") ||
        e.target.closest(".top-btn")
      )
        return;
      isDragging = false;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      globalInitialPointer.set(clientX, clientY);
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
          // Se for objeto da paleta, clone imediatamente (não é arrastável)
          if (obj.userData.isPalette) {
            addChildClone(obj);
            return;
          }
          draggingModel = obj;
          currentTapObject = obj;
          globalInitialPosition.copy(obj.position);
        }
      }
    }

    function onPointerMove(e) {
      if (!draggingModel) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const dx = clientX - globalInitialPointer.x;
      const dy = clientY - globalInitialPointer.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        isDragging = true;
      }
      if (isDragging) {
        const deltaX = dx * 0.002575;
        const deltaY = dy * -0.002575;
        draggingModel.position.set(
          globalInitialPosition.x + deltaX,
          globalInitialPosition.y + deltaY,
          globalInitialPosition.z
        );
      }
    }

    function onPointerUp(e) {
      if (!isDragging && currentTapObject) {
        tapCount++;
        tapTimer = setTimeout(() => {
          if (tapCount === 2) {
            // Duplo-clique: se o objeto não for da paleta, gera um clone interativo
            if (!currentTapObject.userData.isPalette) {
              addChildClone(currentTapObject);
              console.log("Clone gerado (duplo-clique)");
            }
          } else if (tapCount >= 3) {
            // Triple-clique: remove o clone interativo (se aplicável)
            if (currentTapObject.userData.isClone) {
              if (currentTapObject.parent) {
                currentTapObject.parent.remove(currentTapObject);
                console.log("Clone removido (triple-clique)");
              }
            }
          }
          tapCount = 0;
          currentTapObject = null;
        }, TAP_DELAY);
      }
      draggingModel = null;
    }

    document.body.addEventListener("pointerdown", onPointerDown);
    document.body.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("pointerup", onPointerUp);
    document.body.addEventListener("touchstart", onPointerDown);
    document.body.addEventListener("touchmove", onPointerMove);
    document.body.addEventListener("touchend", onPointerUp);

    // ===================== BOTÕES DE UI (Sair, Mandala, Zoom, Reset) =====================
    // Botão Sair (canto superior esquerdo)
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

    // Botão Mandala (canto superior direito) – altera a cor atual e atualiza a paleta e a imagem da lixeira
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
          updatePaletteUI();
          trashBinImg.src = trashBinImages[currentColorIndex];
          trashBinImg.style.display = "block";
          mandalaTapCount = 0;
        }, 0);
      } else if (mandalaTapCount === 2) {
        clearTimeout(mandalaTapTimer);
        mandalaRotation -= 90;
        btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
        currentColorIndex = (currentColorIndex + 1) % 4;
        updatePaletteUI();
        trashBinImg.src = trashBinImages[currentColorIndex];
        trashBinImg.style.display = "block";
        mandalaTapCount = 0;
      }
    });
    document.body.appendChild(btnMandala);

    // Botões de zoom e reset (UI inferior)
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
        if (child.userData && child.userData.originalScale) {
          child.scale.multiplyScalar(1.1);
        }
      });
    }
    function zoomOut() {
      scene.traverse(child => {
        if (child.userData && child.userData.originalScale) {
          child.scale.multiplyScalar(0.9);
        }
      });
    }
    function zoomOriginal() {
      scene.traverse(child => {
        if (child.userData && child.userData.originalScale) {
          child.position.copy(child.userData.originalPosition);
          child.rotation.copy(child.userData.originalRotation);
          child.scale.copy(child.userData.originalScale);
          if (child.userData.rotatable) {
            child.userData.targetRotation = child.userData.originalRotation.z;
          }
        }
      });
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

    const btnOnOff = document.createElement("img");
    btnOnOff.src = "./gltf/imgs/off.jpg";
    btnOnOff.alt = "ON/OFF";
    btnOnOff.style.cursor = "pointer";
    btnOnOff.style.height = isMobile ? "32px" : "35px";
    btnOnOff.style.width = "auto";
    btnOnOff.addEventListener("click", (e) => {
      e.stopPropagation();
      scene.traverse(child => {
        if (child.userData && child.userData.clickable) {
          child.visible = !child.visible;
        }
      });
      btnOnOff.src = btnOnOff.src === "./gltf/imgs/off.jpg" ? "./gltf/imgs/on.jpg" : "./gltf/imgs/off.jpg";
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
      scene.traverse(child => {
        if (child.userData && child.userData.originalScale) {
          child.position.copy(child.userData.originalPosition);
          child.rotation.copy(child.userData.originalRotation);
          child.scale.copy(child.userData.originalScale);
          if (child.userData.rotatable) {
            child.userData.targetRotation = child.userData.originalRotation.z;
          }
        }
      });
      childGroup.clear();
    });
    uiContainerBottom.appendChild(btnReset);

    // ===================== LOOP DE ANIMAÇÃO =====================
    renderer.setAnimationLoop(() => {
      // Atualiza a rotação suave dos modelos nativos (templates), se aplicável
      window._models.forEach(model => {
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
      renderer.render(window._scene, camera);
    });

    // Elemento da lixeira (imagem) – permanece fixo no canto direito superior
    const trashBinImg = document.createElement("img");
    trashBinImg.alt = "Lixeira";
    trashBinImg.style.position = "absolute";
    trashBinImg.style.top = isMobile ? "60px" : "80px";
    trashBinImg.style.right = "10px";
    trashBinImg.style.width = "40px";
    trashBinImg.style.height = "auto";
    trashBinImg.style.display = "none";
    document.body.appendChild(trashBinImg);

    // Inicia a experiência AR
    await window._mindarThree.start();
  };

  start();
});