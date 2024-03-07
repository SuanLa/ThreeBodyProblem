import {Navigate, useRoutes} from "react-router-dom";
import * as React from "react";
import {Setting} from "./ObjSetting";
import DashBoard from "../component/DashBoard";
import Show from "./ObjectShow";
import NotFound from "./Error";


export default function Router(){
    return useRoutes([
        {
            path: "/",
            element: <DashBoard/>,
            children: [
                {
                    path: "/",
                    element: <Navigate to="show" replace={true} />
                },
                {
                    path: "show",
                    element: <Show/>
                },
                {
                    path: "setting",
                    element: <Setting/>
                }
            ]
        },
        {
            path: "*",
            element: <NotFound/>
        }
    ]);
}

