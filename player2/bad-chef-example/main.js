import {loadGLTF} from "./loader.js" 


const THREE = window.MINDAR.IMAGE.THREE
document.addEventListener("DOMContentLoaded", () => {
    const start = async() => {
                        
        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            imageTargetSrc: "./targets.mind"
        })

        const {scene, camera, renderer} = mindarThree

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
        scene.add(light)

        // ===================== GLTF LOADER ======================

        const apple = await loadGLTF("./assets/maçã/Maçã.gltf")
        const pepper = await loadGLTF("./assets/pimenta/Pimenta.gltf")
        const bellPepper = await loadGLTF("./assets/pimentão/Pimentão.gltf")
        const carrot = await loadGLTF("./assets/cenoura/Cenoura.gltf")
        const pumpkin = await loadGLTF("./assets/abóbora/Abóbora.gltf")        
        const broccoli = await loadGLTF("./assets/brócolis/Brócolis.gltf")   
        const onion = await loadGLTF("./assets/cebola/Cebola.gltf")
        const punk = await loadGLTF("./assets/punk/Punk.gltf")

        apple.scene.scale.set(0.05, 0.05, 0.05)
        apple.scene.position.set(-0.44, 0.09, 0)
        apple.scene.rotation.set(0.4, 0, 0)

        pepper.scene.scale.set(0.4, 0.4, 0.4)
        pepper.scene.position.set(-0.01, 0.48, 0)
        
        bellPepper.scene.scale.set(0.26, 0.26, 0.26)
        bellPepper.scene.position.set(0.177, 0.43, 0)
        bellPepper.scene.rotation.set(0.7, 0, 0)

        carrot.scene.scale.set(0.275, 0.275, 0.275)
        carrot.scene.position.set(-0.285, 0.425, 0)

        pumpkin.scene.scale.set(0.25, 0.25, 0.25)
        pumpkin.scene.position.set(0.404, 0.182, 0)
        pumpkin.scene.rotation.set(0.6, 0.2, 0)

        broccoli.scene.scale.set(0.26, 0.26, 0.26)
        broccoli.scene.position.set(-0.38, 0.26, 0)
        broccoli.scene.rotation.set(0, 0, 0.7)

        onion.scene.scale.set(0.25, 0.25, 0.25)
        onion.scene.position.set(0.303, 0.302, 0)
        onion.scene.rotation.set(0, 0, -0.3)

        punk.scene.scale.set(0.15, 0.15, 0.15)
        punk.scene.position.set(0, 0.125, 0)
        

        // ===================== CLICKABLE SCENES ======================
        
        apple.scene.userData.clickable = true; 
        pepper.scene.userData.clickable = true; 
        bellPepper.scene.userData.clickable = true; 
        carrot.scene.userData.clickable = true; 
        pumpkin.scene.userData.clickable = true; 
        broccoli.scene.userData.clickable = true; 
        onion.scene.userData.clickable = true; 
        punk.scene.userData.clickable = true; 

        // ===================== ANCHOR ======================

        const chefAnchor = mindarThree.addAnchor(0)
        
        chefAnchor.group.add(apple.scene)
        chefAnchor.group.add(pepper.scene)
        chefAnchor.group.add(bellPepper.scene)
        chefAnchor.group.add(carrot.scene)
        chefAnchor.group.add(pumpkin.scene)
        chefAnchor.group.add(broccoli.scene)
        chefAnchor.group.add(onion.scene)
        chefAnchor.group.add(punk.scene)

        // ===================== ANIMATION ======================
        
        const appleMixer = new THREE.AnimationMixer(apple.scene)
        const pepperMixer = new THREE.AnimationMixer(pepper.scene)
        const bellPepperMixer = new THREE.AnimationMixer(bellPepper.scene)
        const carrotMixer = new THREE.AnimationMixer(carrot.scene)
        const pumpkinMixer = new THREE.AnimationMixer(pumpkin.scene)
        const broccoliMixer = new THREE.AnimationMixer(broccoli.scene)
        const onionMixer = new THREE.AnimationMixer(onion.scene)
        const punkMixer = new THREE.AnimationMixer(punk.scene)

        const appleAction = appleMixer.clipAction(apple.animations[0])        
        const pepperAction = pepperMixer.clipAction(pepper.animations[0])
        const bellPepperAction = bellPepperMixer.clipAction(bellPepper.animations[0])        
        const carrotAction = carrotMixer.clipAction(carrot.animations[0])
        const pumpkinAction = pumpkinMixer.clipAction(pumpkin.animations[0])
        const broccoliAction = broccoliMixer.clipAction(broccoli.animations[0])
        const onionAction = onionMixer.clipAction(onion.animations[0])
        const punkAction = punkMixer.clipAction(punk.animations[0])
        
        appleAction.play()
        pepperAction.play()
        bellPepperAction.play()
        carrotAction.play()
        pumpkinAction.play()
        broccoliAction.play()
        onionAction.play()
        punkAction.play()

                
        // ===================== EVENT LISTENER, RAYCASTER & INTERSECTIONS ======================


        document.body.addEventListener("pointerdown", onPointerDown);
        document.body.addEventListener("pointermove", onPointerMove);
        document.body.addEventListener("pointerup", onPointerUp);

        var fruitX = punk.scene.position.x;
        var fruitY = punk.scene.position.y;
        var draggingFruit = false;
        var pointerId;
        var initialFruitX;
        var initialFruitY;

        console.log(punk.scene.position.x, fruitX, punk.scene.position.y, fruitY, draggingFruit, pointerId, initialFruitX, initialFruitY)
        
        function onPointerDown(e) {
          console.log('onPointerDown!')

          e.preventDefault();
          
          const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
          const mouseZ = 0.5;
          const mouse = new THREE.Vector3(mouseX, mouseY, mouseZ);

          // const mouseWorldCoordinate = camera.projectGL(mouse) 
          // console.log(mouseWorldCoordinate)

          /*
          projector.projectGLVector(mouse, camera );
          
          mouse3D.sub( camera.position );                
          mouse3D.normalize();

          
          const ndcCoordinate = new THREE.Vector3(-0.5, 0.5, 1);

          const worldCoordinate = camera.projectGL(ndcCoordinate);

          console.log(worldCoordinate);
          */
          

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          if (intersects.length > 0) {
            
            let o = intersects[0].object; 

            while (o.parent && !o.userData.clickable) {
              o = o.parent;
            }

            if (o.userData.clickable) {

              if (o === apple.scene || o === pepper.scene || o === bellPepper.scene ||
                  o === carrot.scene || o === pumpkin.scene || o === broccoli.scene || 
                  o === onion.scene || o === punk.scene) {                       

                  if (o === punk.scene) {

                    console.log('punk clicked')
                    console.log(e)                    
                    console.log(punk.scene.position.x, fruitX, punk.scene.position.y, fruitY, draggingFruit, pointerId, initialFruitX, initialFruitY)

                    pointerId = e.pointerId;
                    
                    draggingFruit = true;
                            
                    initialFruitX = fruitX;
                    initialFruitY = fruitY;
                  }
              }
            }
          }
        }



        function onPointerMove(e) {
          console.log('onPointerMove!')

          e.preventDefault();

          const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
          const mouseZ = 0.5;
          const mouse = new THREE.Vector3(mouseX, mouseY, mouseZ);

          // const mouseWorldCoordinate = camera.projectGL(mouse) 
          // console.log(mouseWorldCoordinate)
          
          /*
          projector.projectGLVector(mouse, camera );
          
          mouse3D.sub( camera.position );                
          mouse3D.normalize();
          */

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          if (intersects.length > 0) {
            
            let o = intersects[0].object; 

            while (o.parent && !o.userData.clickable) {
              o = o.parent;
            }

            if (o.userData.clickable) {

              if (o === apple.scene || o === pepper.scene || o === bellPepper.scene ||
                  o === carrot.scene || o === pumpkin.scene || o === broccoli.scene || 
                  o === onion.scene || o === punk.scene) {                       

                  if (o === punk.scene) {
                    var pointerId = e.pointerId;
        
                    // if (pointerId === draggingFruit) {
                    if (draggingFruit) {

                      console.log(punk.scene.position.x, fruitX, punk.scene.position.y, fruitY, draggingFruit, pointerId, initialFruitX, initialFruitY)

                      console.log(`Intial position: ${o.position.x}, ${o.position.y}`)

                      console.log('punk moved and dragged')

                      fruitX = e.clientX - initialFruitX;
                      fruitY = e.clientY - initialFruitY;
                  
                      o.position.x = fruitX * 0.003;
                      o.position.y = fruitY * 0.003;

                      // o.position.set(e.clientX * 0.003, e.clientY * 0.003, 0 );

                      console.log(punk.scene.position.x, fruitX, punk.scene.position.y, fruitY, draggingFruit, pointerId, initialFruitX, initialFruitY)

                      console.log(`Final position: ${o.position.x}, ${o.position.y}`)
                    } 
                  }
              }
            }
          }
        }
                  
        
       
        function onPointerUp(e) {
          console.log('onPointerUp!')

          const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
          const mouse = new THREE.Vector2(mouseX, mouseY);

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);

          if (intersects.length > 0) {
            
            let o = intersects[0].object; 

            while (o.parent && !o.userData.clickable) {
              o = o.parent;
            }

            if (o.userData.clickable) {

              if (o === apple.scene || o === pepper.scene || o === bellPepper.scene ||
                  o === carrot.scene || o === pumpkin.scene || o === broccoli.scene || 
                  o === onion.scene || o === punk.scene) {                       

                  if (o === punk.scene) {

                    console.log('punk released')
                    var pointerId = e.pointerId;
        
                    // if (pointerId === draggingFruit) {
                    if (draggingFruit) {
                      draggingFruit = false;
                    }
                  } 
              }
            }
          }
        }
        





        // document.body.addEventListener('pointerdown', (e) => {
        //     const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        //     const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        //     const mouse = new THREE.Vector2(mouseX, mouseY);

        //     const raycaster = new THREE.Raycaster();
        //     raycaster.setFromCamera(mouse, camera);
        //     const intersects = raycaster.intersectObjects(scene.children, true);

        //     if (intersects.length > 0) {
              
        //       let o = intersects[0].object; 

        //       while (o.parent && !o.userData.clickable) {
        //         o = o.parent;
        //       }

        //       if (o.userData.clickable) {

        //         if (o === apple.scene || o === pepper.scene || o === bellPepper.scene ||
        //             o === carrot.scene || o === pumpkin.scene || o === broccoli.scene || 
        //             o === onion.scene || o === punk.scene) {                       

        //           if (o === punk.scene) {
        //             console.log('punk on pointerDOWN!')

        //               const x = e.clientX;
        //               const y = e.clientY;
                    
        //               // Start tracking the position of the mouse or finger.
        //               let lastX = x;
        //               let lastY = y;
                    
        //               // Listen for the pointermove event.
        //               document.body.addEventListener("pointermove", (e) => {
                        
        //               const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        //               const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        //               const mouse = new THREE.Vector2(mouseX, mouseY);

        //               const raycaster = new THREE.Raycaster();
        //               raycaster.setFromCamera(mouse, camera);
        //               const intersects = raycaster.intersectObjects(scene.children, true);

        //               if (intersects.length > 0) {
                        
        //                 let o = intersects[0].object; 

        //                 while (o.parent && !o.userData.clickable) {
        //                   o = o.parent;
        //                 }

        //                 if (o.userData.clickable) {
        //                   if (o === punk.scene) {
        //                     console.log('Movendo Punk!')

        //                     const x = e.clientX;
        //                     const y = e.clientY;
                        
        //                     // Move the fruit to the new position.
        //                     o.position.x = x - lastX;
        //                     o.position.y = y - lastY;
                        
        //                     // Update the last position.
        //                     lastX = x;
        //                     lastY = y;
        //                   }
        //                 }
                       
        //               }});

        //           }   
                  
        //         }
        //       }
        //     }
        // })
        

        // document.body.addEventListener('pointermove', (e) => {
        //     const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        //     const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        //     const mouse = new THREE.Vector2(mouseX, mouseY);
        //     const raycaster = new THREE.Raycaster();
        //     raycaster.setFromCamera(mouse, camera);
        //     const intersects = raycaster.intersectObjects(scene.children, true);
      

        //     // https://www.youtube.com/watch?v=MhUCYR9Tb9c
        //     // Learn Pointer Events In 15 Minutes


        //     if (intersects.length > 0) {
              
        //       let o = intersects[0].object; 

        //       while (o.parent && !o.userData.clickable) {
        //         o = o.parent;
        //       }

        //       if (o.userData.clickable) {

        //         if (o === apple.scene || o === pepper.scene || o === bellPepper.scene ||
        //             o === carrot.scene || o === pumpkin.scene || o === broccoli.scene || 
        //             o === onion.scene || o === punk.scene) {      
                      
        //               if (o === punk.scene) {
        //                 console.log('punk on pointerMOVE!')
        //               } 

        //         }
        //       }


        //     }
        //   })
          

        const clock = new THREE.Clock()

        await mindarThree.start()

        renderer.setAnimationLoop(() => {

            const delta = clock.getDelta()

            appleMixer.update(delta)
            pepperMixer.update(delta)
            bellPepperMixer.update(delta)
            carrotMixer.update(delta)
            pumpkinMixer.update(delta)
            broccoliMixer.update(delta)
            onionMixer.update(delta)

            renderer.render(scene, camera)
        })
    }
    start()
})
