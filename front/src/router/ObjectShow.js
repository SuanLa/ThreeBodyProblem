import {Canvas} from "@react-three/fiber";
import Object from "../view/Object";
import {Button, ButtonGroup} from "@mui/material";
import {useState} from "react";

const objs = new useState([]);

const maps = objs.map(
    object => <Object position={object.psi}/>
)

const startRunning = () => {
    connect()
}

export default function Show(){
    const buttons = [
        <Button key={"zuo"}> zuo </Button>,
        <Button key={"||"} onClick={startRunning}>||</Button>,
        <Button key={"you"}> you </Button>
    ]

    return (
        <div id="canvas-container">
            <Canvas>
                {maps}
            </Canvas>
            <ButtonGroup
                color="secondary"
                orientation="horizontal"
                size="large"
                variant="filled"
                className={"btu-g"}
            >
                {buttons}
            </ButtonGroup>
        </div>
    )
}