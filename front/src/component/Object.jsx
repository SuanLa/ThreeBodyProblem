import {useFrame} from "@react-three/fiber";
import "../css/Object.css";

import {useEffect, useRef} from "react";
import {useTexture} from "@react-three/drei";

import color from "../img/Lava004_2K-JPG_Color.jpg";
import emission from "../img/Lava004_2K-JPG_Emission.jpg";
import normalDX from "../img/Lava004_2K-JPG_NormalDX.jpg";
import normalGL from "../img/Lava004_2K-JPG_NormalGL.jpg";

export default function Object({position}){
    useEffect(()=>{
    },[position])

    const [colorMap, normalMap, roughnessMap] = useTexture([
        color,
        emission,
        normalDX,
        normalGL]
    )
    const myMesh = useRef()

    useFrame(() => {
        myMesh.current.rotation.y += 0.001
        myMesh.current.position.x = position.X
        myMesh.current.position.y = position.Y
        myMesh.current.position.z = position.Z
    })

    return (
        <>
            <ambientLight/>
            <directionalLight position={[1, 1, 1]}/>
            <mesh
                position={ [position.X, position.Y, position.Z] }
                ref={myMesh}
            >
                <sphereGeometry/>
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    roughnessMap={roughnessMap}
                />
            </mesh>
        </>
    )
}