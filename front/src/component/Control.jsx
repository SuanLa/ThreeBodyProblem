import {OrbitControls} from "@react-three/drei";

// 相机轨道控制器，开启阻尼让拖动视角更顺滑
export default function Controls() {
    return (
        <OrbitControls makeDefault enableDamping dampingFactor={0.08}/>
    );
}