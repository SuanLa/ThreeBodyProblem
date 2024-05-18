import Navigation from "./Navgation";
import {Outlet} from "react-router-dom";
import {Sider} from "./SideNavigation";
import * as React from "react";
import {useState} from "react";


export default function DashBoard(){

    const [open, setOpen] = useState(true);

    const inversion = () => {
        setOpen(!open);
    }

    return (
        <div>
            <header>
                <Navigation chargeOpen={inversion}/>
            </header>
            <main>
                <Outlet/>
            </main>
            <aside>
                <Sider open={open}/>
            </aside>
        </div>
    );
}