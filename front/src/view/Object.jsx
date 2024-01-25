import {Canvas, useThree} from "@react-three/fiber";
import {useState} from "react";

import "./../css/Object.css";

export default function Object(){

    const position = useThree;
    const intensity = useState();
    const args = useState();

    return (
        <div id="canvas-container">
            <Canvas>
                <ambientLight intensity={0.1} />
                <directionalLight color={"red"} position={[0, 0, 5]} />
                <mesh>
                    <boxGeometry args={[2, 2, 2]}/>
                    <meshStandardMaterial />
                </mesh>
            </Canvas>
        </div>
    )
}