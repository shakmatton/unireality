import {loadGLTF} from "./loader.js" 

const THREE = window.MINDAR.IMAGE.THREE

document.addEventListener("DOMContentLoaded", () => {

    const start = async() => {

        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            // imageTargetSrc: "./targets.mind"
            imageTargetSrc: "./multi_detect.mind",
            maxTrack: 4           // Melhor valor: 2-3                           
        })
    
        const {scene, camera, renderer} = mindarThree

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)      
        // light.intensity = 4.7                                                
        
        scene.add(light)
        
        // const tab = await loadGLTF("./gltf/Tabuleiro.gltf")      
        const ponte = await loadGLTF("./gltf/Bridge.gltf")
        const pa = await loadGLTF("./gltf/Shovel.gltf")
        const bau = await loadGLTF("./gltf/Chest.gltf")
        const player = await loadGLTF("./gltf/Player.gltf")

        // tab.scene.scale.set(0.15, 0.15, 0.15)
        // tab.scene.rotation.x = Math.PI/2
        // tab.scene.position.set(0, 0, 0)
        
        pa.scene.scale.set(0.6, 0.6, 0.6)
        // pa.scene.rotation.x = Math.PI/2
        pa.scene.position.set(3, 2, -4)

        bau.scene.scale.set(0.6, 0.6, 0.6)
        bau.scene.rotation.x = Math.PI/2
        bau.scene.position.set(3, 2.5, -4)
        
        ponte.scene.scale.set(0.6, 0.6, 0.6)
        // ponte.scene.rotation.x = Math.PI/2
        ponte.scene.position.set(1, 1, -4)

        player.scene.scale.set(0.85, 0.85, 0.85)
        player.scene.rotation.y = Math.PI/2
        player.scene.position.set(0, 0, -4)

        // const tabAnchor = mindarThree.addAnchor(0)
        // tabAnchor.group.add(tab.scene)

        const paAnchor = mindarThree.addAnchor(0)
        paAnchor.group.add(pa.scene)

        const bauAnchor = mindarThree.addAnchor(1)
        bauAnchor.group.add(bau.scene)

        const ponteAnchor = mindarThree.addAnchor(2)
        ponteAnchor.group.add(ponte.scene)

        const playerAnchor = mindarThree.addAnchor(3)
        playerAnchor.group.add(player.scene)

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
