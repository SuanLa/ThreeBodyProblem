import {useFrame, useLoader} from "@react-three/fiber";
import "./../css/Object.css";
import {TextureLoader} from "three";

import img_1 from "./../img/img_1.png"
import img_6 from "./../img/img_6.png"
import img_5 from "./../img/img_5.png"
import {useRef} from "react";

export default function Object({position}){
    const [colorMap, specularMap, normalMap] = useLoader(TextureLoader, [img_1, img_6, img_5])
    const myMesh = useRef()

    useFrame(({ clock }) => {
        myMesh.current.rotation.y = clock.getElapsedTime()
    })

    return (
        <>
            <ambientLight intensity={1}/>
            <directionalLight position={position}/>
            <mesh
                onClick={(e) => console.log(position)}
                position={[1,1,1]}
                ref={myMesh}
            >
                <sphereGeometry/>
                <meshStandardMaterial
                    map={colorMap}
                    roughnessMap={specularMap}
                    normalMap={normalMap}
                />
            </mesh>
        </>
    )
}