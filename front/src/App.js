import './css/App.css';
import Navigation from "./model/Navgation";
import Sider from "./model/SideNavigation";
import * as React from "react";
import Object from "./view/Object";
import {Canvas} from "@react-three/fiber";
import {useState} from "react";

function App() {
    const pos = useState([0, 0, 0])

    return (
      <div>
          <header>
              <Navigation/>
          </header>
          <main>
              <div id="canvas-container">
                  <Canvas>
                      <Object position={pos}/>
                  </Canvas>
              </div>
          </main>
          <aside>
              <Sider/>
          </aside>
      </div>
    );
}

export default App;
