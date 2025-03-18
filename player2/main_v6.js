import { loadGLTF } from "./loader.js";

const THREE = window.MINDAR.IMAGE.THREE;
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Imagens para a lixeira (ordem: amarelo, azul, verde, vermelho)
const trashBinImages = [
  "./gltf/imgs/me.jpg",
  "./gltf/imgs/pa.jpg",
  "./gltf/imgs/vi.jpg",
  "./gltf/imgs/pla.jpg"
];

// Imagens para as plaquinhas – para cada tipo (left, right, up) e para cada cor
const platesMapping = {
  0: { left: "./gltf/imgs/vermelho_left.png", right: "./gltf/imgs/vermelho_right.png", up: "./gltf/imgs/vermelho_up.png" },
  1: { left: "./gltf/imgs/verde_left.png",    right: "./gltf/imgs/verde_right.png",    up: "./gltf/imgs/verde_up.png"    },
  2: { left: "./gltf/imgs/azul_left.png",     right: "./gltf/imgs/azul_right.png",     up: "./gltf/imgs/azul_up.png"     },
  3: { left: "./gltf/imgs/amarelo_left.png",  right: "./gltf/imgs/amarelo_right.png",  up: "./gltf/imgs/amarelo_up.png"  }
};

let currentColorIndex = 0; // Inicia com 0 para que as plaquinhas apareçam

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    /* =============================
       Inicialização do MindAR
       ============================= */
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./p2_papel.mind"
    });
    const { scene, camera, renderer } = mindarThree;
    
    // Configure o canvas com z-index alto para receber eventos
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.zIndex = "10";
    
    // Iluminação básica
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    /* =============================
       Grupo de Objetos 3D: Recicle
       ============================= */
    const recicleGroup = new THREE.Group();
    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(recicleGroup);
    anchor.onTargetFound = () => {
      console.log("Alvo detectado! (scanner continua ativo)");
    };
    
    const recicleGroupInitialScale = recicleGroup.scale.clone();
    
    // Carrega o GLTF do objeto Recicle
    const recicleGLTF = await loadGLTF("./gltf/recicle.gltf");
    
    // Função para criar uma instância do objeto Recicle
    function createRecicleInstance(offset = new THREE.Vector3(0, 0, 0)) {
      const recicleObj = recicleGLTF.scene.clone();
      recicleObj.scale.set(0.1, 0.1, 0.1); // escala menor
      recicleObj.position.copy(offset);
      recicleObj.userData = {
        initialTransform: {
          position: recicleObj.position.clone(),
          rotation: recicleObj.rotation.clone(),
          scale: recicleObj.scale.clone()
        },
        clickCount: 0,
        clickTimer: null,
        isRecicle: true,
        clickable: true,
        rotatable: false // para Recicle, clique único NÃO roda (rotação só para "up")
      };
      // Atualiza bounding boxes para o raycaster
      recicleObj.traverse(child => {
        if (child.isMesh && child.geometry) {
          child.geometry.computeBoundingBox();
          child.raycast = THREE.Mesh.prototype.raycast;
          child.userData.clickable = true;
        }
      });
      recicleObj.updateMatrixWorld();
      return recicleObj;
    }
    
    // Cria o objeto Recicle original e o adiciona ao grupo
    const originalRecicle = createRecicleInstance(new THREE.Vector3(0.5, 0, 0));
    recicleGroup.add(originalRecicle);
    
    /* =============================
       Eventos de Interação para Recicle
       (Arrastar, Clique, Duplicar e Remover)
       ============================= */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingObject = null;
    let dragOffset = new THREE.Vector3();
    let pointerDownPos = new THREE.Vector2();
    // Plano de arrasto com normal (0,0,1)
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    
    renderer.domElement.addEventListener("pointerdown", (event) => {
      console.log("pointerdown:", event.clientX, event.clientY);
      pointerDownPos.set(event.clientX, event.clientY);
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(recicleGroup.children, true);
      if (intersects.length > 0) {
        console.log("Interseção detectada:", intersects[0].object);
        draggingObject = intersects[0].object;
        while (!draggingObject.userData.isRecicle && draggingObject.parent) {
          draggingObject = draggingObject.parent;
        }
        const objectWorldPos = new THREE.Vector3();
        draggingObject.getWorldPosition(objectWorldPos);
        dragPlane.constant = -objectWorldPos.z;
        const intersectPointWorld = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPointWorld);
        const localIntersectPoint = intersectPointWorld.clone();
        anchor.group.worldToLocal(localIntersectPoint);
        dragOffset.copy(draggingObject.position).sub(localIntersectPoint);
      } else {
        console.log("Nenhuma interseção detectada no pointerdown.");
      }
    });
    
    renderer.domElement.addEventListener("pointermove", (event) => {
      console.log("pointermove:", event.clientX, event.clientY);
      if (draggingObject) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(pointer, camera);
        const intersectPointWorld = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(dragPlane, intersectPointWorld);
        if (hit) {
          const localIntersectPoint = intersectPointWorld.clone();
          anchor.group.worldToLocal(localIntersectPoint);
          const speedFactor = 2.0; // Aumenta a velocidade do arrasto
          // Multiplicamos o dragOffset para ampliar o deslocamento
          draggingObject.position.copy(localIntersectPoint.add(dragOffset.multiplyScalar(speedFactor)));
          console.log("Objeto arrastado para (local):", draggingObject.position);
        } else {
          console.log("Sem interseção no pointermove.");
        }
      }
    });
    
    renderer.domElement.addEventListener("pointerup", (event) => {
      console.log("pointerup:", event.clientX, event.clientY);
      if (draggingObject) {
        const dx = event.clientX - pointerDownPos.x;
        const dy = event.clientY - pointerDownPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
          // Clique rápido (não arrasto): trata cliques
          const clickedObject = draggingObject;
          clickedObject.userData.clickCount = (clickedObject.userData.clickCount || 0) + 1;
          console.log("Clique detectado. clickCount:", clickedObject.userData.clickCount);
          if (clickedObject.userData.clickTimer) {
            clearTimeout(clickedObject.userData.clickTimer);
          }
          clickedObject.userData.clickTimer = setTimeout(() => {
            if (clickedObject.userData.clickCount === 2) {
              // Duplo clique: duplicar o objeto usando a mesma função de criação
              const cloneOffset = new THREE.Vector3(0.2, -0.2, 0);
              const newPos = clickedObject.position.clone().add(cloneOffset);
              const clone = createRecicleInstance(newPos);
              recicleGroup.add(clone);
              console.log("Recicle duplicado (2 cliques)");
            } else if (clickedObject.userData.clickCount >= 3) {
              // Triplo clique: remove o objeto
              recicleGroup.remove(clickedObject);
              console.log("Recicle removido (3 cliques)");
            }
            clickedObject.userData.clickCount = 0;
            clickedObject.userData.clickTimer = null;
          }, 300);
        }
      }
      draggingObject = null;
    });
    
    /* =============================
       UI – BASEADO NO CÓDIGO DE APOIO
       ============================= */
    
    // UI inferior – Container para botões de Zoom (quadrados)
    const zoomContainer = document.createElement("div");
    zoomContainer.style.position = "absolute";
    zoomContainer.style.bottom = "20px";
    zoomContainer.style.left = "50%";
    zoomContainer.style.transform = "translateX(-50%)";
    zoomContainer.style.display = "flex";
    zoomContainer.style.gap = "10px";
    zoomContainer.style.zIndex = "1000";
    zoomContainer.style.pointerEvents = "auto";
    document.body.appendChild(zoomContainer);
    
    function createUIButton(src, alt, onClick) {
      const btn = document.createElement("img");
      btn.src = src;
      btn.alt = alt;
      btn.style.cursor = "pointer";
      // Dimensões originais: 32px (mobile) ou 35px (desktop)
      btn.style.width = isMobile ? "32px" : "35px";
      btn.style.height = isMobile ? "32px" : "35px";
      btn.style.pointerEvents = "auto";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
      });
      return btn;
    }
    
    function zoomIn() {
      recicleGroup.scale.multiplyScalar(1.1);
      console.log("Zoom In acionado");
    }
    function zoomOut() {
      recicleGroup.scale.multiplyScalar(0.9);
      console.log("Zoom Out acionado");
    }
    function zoomOriginal() {
      recicleGroup.scale.copy(recicleGroupInitialScale);
      resetRecicleGroup();
      console.log("Zoom Original acionado");
    }
    
    zoomContainer.appendChild(createUIButton("./gltf/imgs/home.png", "Zoom Original", zoomOriginal));
    zoomContainer.appendChild(createUIButton("./gltf/imgs/plus.jpg", "Zoom+", zoomIn));
    zoomContainer.appendChild(createUIButton("./gltf/imgs/minus.jpg", "Zoom-", zoomOut));
    
    // UI inferior – Container para botões ON/OFF e Reset (retangulares)
    // Criamos uma função específica para botões retangulares, sem forçar dimensões quadradas
    function createRectangularButton(src, alt, onClick) {
      const btn = document.createElement("img");
      btn.src = src;
      btn.alt = alt;
      btn.style.cursor = "pointer";
      btn.style.maxHeight = isMobile ? "40px" : "50px";
      btn.style.pointerEvents = "auto";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
      });
      return btn;
    }
    
    const controlContainer = document.createElement("div");
    controlContainer.style.position = "absolute";
    controlContainer.style.bottom = "20px";
    controlContainer.style.right = "10px";
    controlContainer.style.display = "flex";
    controlContainer.style.flexDirection = "column";
    controlContainer.style.gap = "10px";
    controlContainer.style.zIndex = "1000";
    controlContainer.style.pointerEvents = "auto";
    document.body.appendChild(controlContainer);
    
    let objetosVisiveis = true;
    controlContainer.appendChild(createRectangularButton("./gltf/imgs/off.jpg", "ON/OFF", () => {
      objetosVisiveis = !objetosVisiveis;
      recicleGroup.visible = objetosVisiveis;
      console.log("ON/OFF acionado:", objetosVisiveis);
    }));
    
    controlContainer.appendChild(createRectangularButton("./gltf/imgs/reset.jpg", "Reset", () => {
      resetRecicleGroup();
    }));
    
    function resetRecicleGroup() {
      recicleGroup.children.forEach(child => {
        if(child === originalRecicle) {
          if(child.userData.initialTransform) {
            child.position.copy(child.userData.initialTransform.position);
            child.rotation.copy(child.userData.initialTransform.rotation);
            child.scale.copy(child.userData.initialTransform.scale);
          }
        } else {
          recicleGroup.remove(child);
        }
      });
      console.log("RecicleGroup reset");
    }
    
    // Menu lateral – ícones do lado direito
    const menuContainer = document.createElement("div");
    menuContainer.style.position = "absolute";
    menuContainer.style.top = "170px"; // Aumentado para dar mais espaço (abaixo da lixeira)
    menuContainer.style.right = "10px";
    menuContainer.style.display = "flex";
    menuContainer.style.flexDirection = "column";
    menuContainer.style.gap = "25px"; // Gap maior entre os ícones
    menuContainer.style.zIndex = "1000";
    document.body.appendChild(menuContainer);
    
    // Ícone Recicle – gera um novo objeto Recicle com todas as funcionalidades
    const recicleIcon = document.createElement("img");
    recicleIcon.src = "./gltf/imgs/recicle.png";
    recicleIcon.alt = "Recicle";
    recicleIcon.style.width = "40px";
    recicleIcon.style.height = "auto";
    recicleIcon.style.cursor = "pointer";
    recicleIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const offset = new THREE.Vector3(0.5, 0, 0).add(new THREE.Vector3(0.2, -0.2, 0));
      const newRecicle = createRecicleInstance(offset);
      recicleGroup.add(newRecicle);
      console.log("Recicle criado via ícone Recicle");
    });
    menuContainer.appendChild(recicleIcon);
    
    // Ícone Colete (exemplo; sem funcionalidades adicionais)
    const coleteIcon = document.createElement("img");
    coleteIcon.src = "./gltf/imgs/colete.png";
    coleteIcon.alt = "Colete";
    coleteIcon.style.width = "40px";
    coleteIcon.style.height = "auto";
    coleteIcon.style.cursor = "pointer";
    coleteIcon.addEventListener("click", (e) => { e.stopPropagation(); });
    menuContainer.appendChild(coleteIcon);
    
    // Ícone Loop2_molde
    const loop2Icon = document.createElement("img");
    loop2Icon.src = "./gltf/imgs/loop-2.png";
    loop2Icon.alt = "Loop 2";
    loop2Icon.style.width = "40px";
    loop2Icon.style.height = "auto";
    loop2Icon.style.cursor = "pointer";
    loop2Icon.addEventListener("click", (e) => { e.stopPropagation(); });
    menuContainer.appendChild(loop2Icon);
    
    // Ícone Loop3_molde
    const loop3Icon = document.createElement("img");
    loop3Icon.src = "./gltf/imgs/loop-3.png";
    loop3Icon.alt = "Loop 3";
    loop3Icon.style.width = "40px";
    loop3Icon.style.height = "auto";
    loop3Icon.style.cursor = "pointer";
    loop3Icon.addEventListener("click", (e) => { e.stopPropagation(); });
    menuContainer.appendChild(loop3Icon);
    
    // Área de plaquinhas (abaixo da lixeira) – com gap maior
    const platesForTrashContainer = document.createElement("div");
    platesForTrashContainer.style.position = "absolute";
    platesForTrashContainer.style.top = "250px"; // Ajustado para dar mais espaço abaixo da lixeira
    platesForTrashContainer.style.right = "10px";
    platesForTrashContainer.style.display = "flex";
    platesForTrashContainer.style.flexDirection = "column";
    platesForTrashContainer.style.gap = "5px";
    platesForTrashContainer.style.alignItems = "center";
    platesForTrashContainer.style.zIndex = "1000";
    document.body.appendChild(platesForTrashContainer);
    
    function updatePlatesForTrash() {
      platesForTrashContainer.innerHTML = "";
      if (currentColorIndex === -1) return;
      const plateTypes = ["left", "right", "up"];
      plateTypes.forEach(type => {
        const plateImg = document.createElement("img");
        plateImg.src = platesMapping[currentColorIndex][type];
        plateImg.alt = `Placa ${type}`;
        plateImg.style.width = isMobile ? "41px" : "40px";
        plateImg.style.cursor = "pointer";
        // Clique nas plaquinhas (exemplo: nenhuma ação definida)
        plateImg.addEventListener("click", (e) => { e.stopPropagation(); });
        platesForTrashContainer.appendChild(plateImg);
      });
    }
    
    // Ícone Fingers – logo abaixo da Mandala
    const fingersIcon = document.createElement("img");
    fingersIcon.src = "./gltf/imgs/fingers1b.jpg";
    fingersIcon.alt = "Fingers";
    fingersIcon.style.position = "absolute";
    fingersIcon.style.top = "50px";
    fingersIcon.style.right = "10px";
    fingersIcon.style.width = "40px";
    fingersIcon.style.height = "auto";
    fingersIcon.style.zIndex = "1000";
    document.body.appendChild(fingersIcon);
    
    // Elemento Lixeira – fica abaixo do Fingers
    const trashBinImg = document.createElement("img");
    trashBinImg.alt = "Lixeira";
    trashBinImg.style.position = "absolute";
    trashBinImg.style.top = "110px"; // Ajustado para dar espaçamento
    trashBinImg.style.right = "10px";
    trashBinImg.style.width = "40px";
    trashBinImg.style.height = "auto";
    trashBinImg.style.display = "none";
    trashBinImg.style.zIndex = "1000";
    document.body.appendChild(trashBinImg);
    
    // Botão Mandala (canto superior direito)
    let mandalaTapCount = 0;
    let mandalaTapTimer = null;
    let mandalaRotation = 0;
    const TAP_DELAY = 300;
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
          updatePlatesForTrash();
          trashBinImg.src = trashBinImages[currentColorIndex];
          trashBinImg.style.display = "block";
          mandalaTapCount = 0;
        }, TAP_DELAY);
      } else if (mandalaTapCount === 2) {
        clearTimeout(mandalaTapTimer);
        mandalaRotation -= 90;
        btnMandala.style.transform = `rotate(${mandalaRotation}deg)`;
        currentColorIndex = (currentColorIndex + 1) % 4;
        updatePlatesForTrash();
        trashBinImg.src = trashBinImages[currentColorIndex];
        trashBinImg.style.display = "block";
        mandalaTapCount = 0;
      }
    });
    document.body.appendChild(btnMandala);
    
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
    
    /* =============================
       Loop de Animação
       ============================= */
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
    
    await mindarThree.start();
  };
  
  start();
});