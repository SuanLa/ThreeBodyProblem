import "./../css/App.css";
import "./../css/myCss.css"
import {Stack} from "@mui/material";

export default function Sider(){
    return (
        <Stack spacing={2} className={"subColor innerContainer sideContainer"}>
            <div className={"choiceBar"}>物体视图</div>
            <div className={"choiceBar"}>物体设置</div>
        </Stack>
    );
}