// https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/


import {loadGLTF} from "./loader.js" 

const THREE = window.MINDAR.IMAGE.THREE

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {

        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            //imageTargetSrc: "./targets.mind"
            //imageTargetSrc: "./multi_detect.mind",
            //imageTargetSrc: "./lata_papel_2.mind"
            //imageTargetSrc: "./yellow_bin.mind"
            imageTargetSrc: "./yellow_red_green_blue_bins.mind"
            // imageTargetSrc: "./yellow-red-green-blue&lata-garrafa-vidro-papel"            

            //maxTrack: 2           // Melhor valor: 2-3                           
        })
    
        const {scene, camera, renderer} = mindarThree

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)      
        // light.intensity = 4.7                                                
        
        scene.add(light)

        // <=======================   GLTF LOADING   =========================>
                
        //const lata = await loadGLTF("./gltf/lata.gltf")
        // const lata = await loadGLTF("./gltf/lata2.gltf")
        //const papel = await loadGLTF("./gltf/papel.gltf")
        // const papel = await loadGLTF("./gltf/papel2.gltf")        

        const yellow = await loadGLTF("./gltf/yellow.gltf")
        const red = await loadGLTF("./gltf/red.gltf")
        const green = await loadGLTF("./gltf/green.gltf")
        const blue = await loadGLTF("./gltf/blue.gltf")

        // <====================   POSITION AND SCALE   ======================>

        yellow.scene.scale.set(0.85, 0.85, 0.85)
        yellow.scene.position.set(0, 0, 0)

        red.scene.scale.set(0.85, 0.85, 0.85)
        red.scene.position.set(0, 0, 0)

        green.scene.scale.set(0.85, 0.85, 0.85)
        green.scene.position.set(0, 0, 0)

        blue.scene.scale.set(0.85, 0.85, 0.85)
        blue.scene.position.set(0, 0, 0)

        // lata.scene.scale.set(0.5, 0.5, 0.5)        
        // lata.scene.position.set(0, 0, 0)

        // papel.scene.scale.set(0.5, 0.5, 0.5)        
        // papel.scene.position.set(0, 0, 0)

        // <=======================   ANCHORS   =========================>

        const yellowAnchor = mindarThree.addAnchor(0)
        yellowAnchor.group.add(yellow.scene) 

        const redAnchor = mindarThree.addAnchor(1)
        redAnchor.group.add(red.scene) 

        const greenAnchor = mindarThree.addAnchor(2)
        greenAnchor.group.add(green.scene) 

        const blueAnchor = mindarThree.addAnchor(3)
        blueAnchor.group.add(blue.scene) 

        // const lataAnchor = mindarThree.addAnchor(0)
        // lataAnchor.group.add(lata.scene)

        // const papelAnchor = mindarThree.addAnchor(1)
        // papelAnchor.group.add(papel.scene)

        // <=======================   ANIMATION   =========================>

        const yellowMixer = new THREE.AnimationMixer(yellow.scene);
        const yellowAction = yellowMixer.clipAction(yellow.animations[1]);
        
        const redMixer = new THREE.AnimationMixer(red.scene);
        const redAction = redMixer.clipAction(red.animations[1]);

        const greenMixer = new THREE.AnimationMixer(green.scene);
        const greenAction = greenMixer.clipAction(green.animations[1]);

        const blueMixer = new THREE.AnimationMixer(blue.scene);
        const blueAction = blueMixer.clipAction(blue.animations[1]);

        yellowAction.play();
        redAction.play();
        greenAction.play();
        blueAction.play();

        
        //  // Modifica o material do plano para ser visível em ambos os lados
        // scene.traverse((child) => {
        //     if (child.isMesh) {
        //         child.material.side = THREE.DoubleSide
        //     }
        // })


        await mindarThree.start()

        const clock = new THREE.Clock();

        renderer.setAnimationLoop(() => {            
            
            const deltaTime = clock.getDelta();
            yellowMixer.update(deltaTime);
            redMixer.update(deltaTime);
            greenMixer.update(deltaTime);
            blueMixer.update(deltaTime);

            renderer.render(scene, camera);
        });

            
            // Render techniques for improving lightning:
            // renderer.outputEncoding = THREE.LinearEncoding;
            // renderer.shadowMap.enabled = true;
            // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // renderer.physicallyCorrectLights = true; 

    }

    start()
    
})