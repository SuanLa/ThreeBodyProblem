import {createBrowserRouter} from "react-router-dom";
import * as React from "react";
import App from "./App";
import Object from "./view/Object";
import {Setting} from "./view/ObjSetting";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "ui/:show",
                element: <Object/>
            },
            {
                path: "ui/:setting",
                element: <Setting/>
            }
        ]
    }
]);