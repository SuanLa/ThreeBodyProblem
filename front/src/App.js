import './css/App.css';
import Navigation from "./model/Navgation";
import * as React from "react";
import Object from "./view/Object";
import {Canvas} from "@react-three/fiber";
import {useState} from "react";
import {Outlet} from "react-router-dom";

function App() {


    const pos = useState([0, 0, 0])
    const pos1 = useState([2, 2, 2])
    const pos2 = useState([-2, -2, -2])

    return (
      <div>
          <header>
              <Navigation/>
          </header>
          <main>
              <Outlet/>
              <div id="canvas-container">
                  <Canvas>
                      <Object position={pos}/>
                      <Object position={pos1}/>
                      <Object position={pos2}/>
                  </Canvas>
              </div>
          </main>
          <aside>
          </aside>
      </div>
    );
}

export default App;
