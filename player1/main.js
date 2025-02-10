// https://hiukim.github.io/mind-ar-js-doc/quick-start/tracking-config/


import {loadGLTF} from "./loader.js" 

const THREE = window.MINDAR.IMAGE.THREE

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {

        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            //imageTargetSrc: "./targets.mind"
            //imageTargetSrc: "./multi_detect.mind",
            imageTargetSrc: "./lata_papel_2.mind"
            //maxTrack: 2           // Melhor valor: 2-3                           
        })
    
        const {scene, camera, renderer} = mindarThree

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)      
        // light.intensity = 4.7                                                
        
        scene.add(light)
                
        //const lata = await loadGLTF("./gltf/lata.gltf")
        const lata = await loadGLTF("./gltf/lata2.gltf")
        //const papel = await loadGLTF("./gltf/papel.gltf")
        const papel = await loadGLTF("./gltf/papel2.gltf")        


        lata.scene.scale.set(0.5, 0.5, 0.5)        
        lata.scene.position.set(0, 0, 0)

        papel.scene.scale.set(0.5, 0.5, 0.5)        
        papel.scene.position.set(0, 0, 0)


        const lataAnchor = mindarThree.addAnchor(0)
        lataAnchor.group.add(lata.scene)

        const papelAnchor = mindarThree.addAnchor(1)
        papelAnchor.group.add(papel.scene)

        
        //  // Modifica o material do plano para ser visível em ambos os lados
        // scene.traverse((child) => {
        //     if (child.isMesh) {
        //         child.material.side = THREE.DoubleSide
        //     }
        // })


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
