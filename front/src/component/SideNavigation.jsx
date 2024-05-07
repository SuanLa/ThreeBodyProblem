import "./../css/App.css";
import "./../css/myCss.css"
import {Stack} from "@mui/material";
import {NavLink} from "react-router-dom";

export function Sider({show}){
    return (
        <Stack spacing={2} className={"subColor innerContainer sideContainer"}>
            <NavLink to={"/show"} className={"choiceBar"}>物体视图</NavLink>
            <NavLink to={"/setting"} className={"choiceBar"}>物体设置</NavLink>
        </Stack>
    );
}