import {Canvas} from "@react-three/fiber";
import {useState} from "react";

export default function Object(){

    const position = useState([0, 0, 5]);
    const intensity = useState(0.1);
    const args = useState([6, 6, 6]);

    return (
        <div id="canvas-container">
            <Canvas>
                <ambientLight intensity={intensity} />
                <directionalLight color="red" position={position} />
                <mesh position={[10, 10, 10]}>
                    <boxGeometry args={args} />
                    <meshStandardMaterial />
                </mesh>
            </Canvas>
        </div>
    )
}