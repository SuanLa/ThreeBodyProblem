import Navigation from "./Navgation";
import {Outlet} from "react-router-dom";
import {Sider} from "./SideNavigation";
import * as React from "react";


export default function DashBoard(){

    return (
        <div>
            <header>
                <Navigation/>
            </header>
            <main>
                <Outlet/>
            </main>
            <aside>
                <Sider/>
            </aside>
        </div>
    );
}