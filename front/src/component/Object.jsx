import {useFrame} from "@react-three/fiber";
import "../css/Object.css";

import {useRef, useState} from "react";
import {Trail, useTexture} from "@react-three/drei";
import * as THREE from "three";

import color from "../img/Lava004_2K-JPG_Color.jpg";
import emission from "../img/Lava004_2K-JPG_Emission.jpg";
import normalGL from "../img/Lava004_2K-JPG_NormalGL.jpg";
import roughness from "../img/Lava004_2K-JPG_Roughness.jpg";

export default function Object({position, getPosition, trailColor, radius = 1, trailWidth = 1.6, ghost = false}){

    const [colorMap, emissiveMap, normalMap, roughnessMap] = useTexture([
        color,
        emission,
        normalGL,
        roughness]
    )
    const myMesh = useRef()

    // 服务端最新位置的暂存向量，复用同一个对象避免每帧新建
    const [target] = useState(() => new THREE.Vector3(position.X, position.Y, position.Z))

    useFrame(() => {
        const latest = getPosition && getPosition()
        if (latest) {
            target.set(latest.X, latest.Y, latest.Z)
        }
        // 向服务端最新位置平滑插值，消除推送间隔造成的跳动
        myMesh.current.position.lerp(target, 0.15)
        myMesh.current.rotation.y += 0.002
    })

    return (
        <Trail
            width={trailWidth}
            length={24}
            color={trailColor}
            attenuation={(w) => w * w}
        >
            <mesh
                position={ [position.X, position.Y, position.Z] }
                ref={myMesh}
            >
                <sphereGeometry args={[radius, 64, 64]}/>
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    roughnessMap={roughnessMap}
                    emissiveMap={emissiveMap}
                    emissive={"#ff6a00"}
                    emissiveIntensity={ghost ? 0.6 : 1.4}
                    transparent={ghost}
                    opacity={ghost ? 0.4 : 1}
                />
            </mesh>
        </Trail>
    )
}