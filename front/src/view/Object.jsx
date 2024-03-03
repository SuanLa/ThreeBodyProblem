import {useFrame, useLoader} from "@react-three/fiber";
import "./../css/Object.css";
import {TextureLoader} from "three";

import img_1 from "./../img/img_1.png"
import img_6 from "./../img/img_6.png"
import img_5 from "./../img/img_5.png"
import {useEffect, useRef} from "react";

export default function Object({position}){
    useEffect(() => {
        console.log(position[0])
    }, [position]);

    const [colorMap, specularMap, normalMap] = useLoader(TextureLoader, [img_1, img_6, img_5])
    const myMesh = useRef()

    useFrame(({ clock }) => {
        myMesh.current.rotation.y = clock.getElapsedTime()
    })

    return (
        <>
            <ambientLight intensity={1}/>
            <directionalLight position={[1,1,1]}/>
            <mesh
                onClick={(e) => console.log(position)}
                position={position[0]}
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