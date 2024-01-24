import './css/App.css';
import Navigation from "./model/Navgation";
import Sider from "./model/SideNavigation";
import * as React from "react";
import Object from "./view/Object";

function App() {
  return (
      <div>
          <header>
              <Navigation/>
          </header>
          <main className={"mainContainer"}>
              <Object/>
          </main>
          <aside>
              <Sider/>
          </aside>
      </div>
  );
}

export default App;
