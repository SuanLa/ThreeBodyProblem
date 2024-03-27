import {useFrame, useLoader, useThree} from "@react-three/fiber";
import "./../css/Object.css";
import {TextureLoader} from "three";

import img_1 from "./../img/img_1.png"
import img_6 from "./../img/img_6.png"
import img_5 from "./../img/img_5.png"
import {useEffect, useRef, useState} from "react";

export default function Object({position}){
    useEffect(()=>{
        console.log(position)
    },[position])

    const [active,  setActive] = useState(1)
    const [colorMap, specularMap, normalMap] = useLoader(TextureLoader, [img_1, img_6, img_5])
    const myMesh = useRef()

    useFrame(() => {
        myMesh.current.position.x = position.X
        myMesh.current.position.y = position.Y
        myMesh.current.position.z = position.Z
    })

    return (
        <>
            <ambientLight intensity={1}/>
            <directionalLight position={[1,1,1]}/>
            <mesh
                scale={active}
                onWheel={(e) => setActive(e.deltaY > 0 ? active - 0.1 : active + 0.1)}
                position={[position.X,position.Y,position.Z]}
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