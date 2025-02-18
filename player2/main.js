import {loadGLTF} from "./loader.js" 

const THREE = window.MINDAR.IMAGE.THREE

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {

        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            imageTargetSrc: "./targets.mind"
            //maxTrack: 2           // Melhor valor: 2-3                           
        })
    
        const {scene, camera, renderer} = mindarThree

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)      
        // light.intensity = 4.7                                                
        
        scene.add(light)
        
        const me = await loadGLTF("./gltf/me.gltf")  
        const pa = await loadGLTF("./gltf/pa.gltf")
        const pla = await loadGLTF("./gltf/pla.gltf")
        const vi = await loadGLTF("./gltf/vi.gltf")       

        me.scene.scale.set(0.13, 0.13, 0.13)
        // me.scene.rotation.x = Math.PI/2
        me.scene.position.set(0, 0, 0)
        
        pa.scene.scale.set(0.13, 0.13, 0.13)
        // pa.scene.rotation.x = Math.PI/2
        pa.scene.position.set(0.5, 0.5, 0)

        pla.scene.scale.set(0.13, 0.13, 0.13)
        // pla.scene.rotation.x = Math.PI/2
        pla.scene.position.set(-0.5, -0.5, 0)

        vi.scene.scale.set(0.13, 0.13, 0.13)
        // vi.scene.rotation.x = Math.PI/2
        vi.scene.position.set(0.5, -0.5, 0)

        // ===================== CLICKABLE SCENES ======================
        
        me.scene.userData.clickable = true; 
        pa.scene.userData.clickable = true; 
        pla.scene.userData.clickable = true; 
        vi.scene.userData.clickable = true;

        // ===================== ANCHOR ======================


        const meAnchor = mindarThree.addAnchor(0)
        meAnchor.group.add(me.scene)

        const paAnchor = mindarThree.addAnchor(0)
        paAnchor.group.add(pa.scene)

        const plaAnchor = mindarThree.addAnchor(0)
        plaAnchor.group.add(pla.scene)

        const viAnchor = mindarThree.addAnchor(0)
        viAnchor.group.add(vi.scene)
        

        // ===================== EVENT LISTENER, RAYCASTER & INTERSECTIONS ======================

        document.body.addEventListener("pointerdown", onPointerDown);
        document.body.addEventListener("pointermove", onPointerMove);
        document.body.addEventListener("pointerup", onPointerUp);
        

        var me_X = me.scene.position.x;
        var me_Y = me.scene.position.y;
        var draggingMe = false;
        var pointerId;
        var initialMeX;
        var initialMeY;

        console.log(me.scene.position.x, me_X, me.scene.position.y, me_Y, draggingMe, pointerId, initialMeX, initialMeY)

        function onPointerDown(e) {
            console.log('onPointerDown!')
  
            e.preventDefault();
            
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            const mouseZ = 0.5;
            const mouse = new THREE.Vector3(mouseX, mouseY, mouseZ);

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
            
            let o = intersects[0].object; 

            while (o.parent && !o.userData.clickable) {
              o = o.parent;
            }

            if (o.userData.clickable) {

              if (o === me.scene) {                       

                  if (o === me.scene) {

                    console.log('me clicked')
                    console.log(e)                    
                    console.log(me.scene.position.x, me_X, me.scene.position.y, me_Y, draggingMe, pointerId, initialMeX, initialMeY)

                    pointerId = e.pointerId;
                    
                    draggingMe = true;
                            
                    initialMeX = me_X;
                    initialMeY = me_Y;
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
  
                if (o === me.scene) {                       
  
                    if (o === me.scene) {
                      var pointerId = e.pointerId;
          
                      // if (pointerId === draggingFruit) {
                      if (draggingMe) {
  
                        console.log(me.scene.position.x, me_X, me.scene.position.y, me_Y, draggingMe, pointerId, initialMeX, initialMeY)
  
                        console.log(`Intial position: ${o.position.x}, ${o.position.y}`)
  
                        console.log('me moved and dragged')
  
                        me_X = e.clientX - initialMeX;
                        me_Y = e.clientY - initialMeY;
                    
                        o.position.x = me_X * 0.003;
                        o.position.y = me_Y * -0.003;
  
                        // o.position.set(e.clientX * 0.003, e.clientY * 0.003, 0 );
  
                        console.log(me.scene.position.x, me_X, me.scene.position.y, me_Y, draggingMe, pointerId, initialMeX, initialMeY)
  
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

            if (o === me.scene) {                       

                if (o === me.scene) {

                    console.log('me released')
                    var pointerId = e.pointerId;
        
                    // if (pointerId === draggingMe) {
                    if (draggingMe) {
                        draggingMe = false;
                    }
                } 
            }
            }
        }
        }


        await mindarThree.start()

        renderer.setAnimationLoop(() => {
            renderer.render(scene,camera)
            
            // Render techniques for improving lightning:
            // renderer.outputEncoding = THREE.LinearEncoding;
            // renderer.shadowMap.enabled = true;
            // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // renderer.physicallyCorrectLights = true; 

        })    
    }

    start()
    
})
