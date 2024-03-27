import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {extend, useFrame, useThree} from "@react-three/fiber";
import {useRef} from "react"; // 导入 OrbitControls

// 将 OrbitControls 扩展为可在 React-Three-Fiber 中使用的组件
extend({ OrbitControls });

export default function Controls() {
    const { camera, gl } = useThree();
    const controlsRef = useRef();

    // 在每一帧更新 OrbitControls
    useFrame(() => {
        controlsRef.current.update();
    });

    return (
        <orbitControls ref={controlsRef} args={[camera, gl.domElement]} />
    );
}