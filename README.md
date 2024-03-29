# <div align='center'>Three Body Problem</div>

<div align='center'> <img src="https://github.com/SuanLa/ThreeBodyProblem/blob/main/front/public/fav.png"></div>

三体问题的仿真，通过前端的渲染引擎来动态展示三体问题的变化。而后端采用go语言计算三体的实时位置，并通过websocket协议主动推送给前端。达到三体问题在前端的仿真。

- 前端采用react和three.js引擎渲染
- 数据处理部分使用go语言开发，能够快速计算出物体运动轨迹。
- 后端与前端建立websocket连接，主动向前端推送字节流，两部分通过协议解析数据。



## 前端

| 框架              | 使用                                                         | 链接                                        |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------- |
| react             | 用于构建 Web 和原生交互界面的框架。                          | https://github.com/facebook/react           |
| three             | Three.js 是一款 webGL引擎，可以运行于所有支持 webGL 的浏览器。 | https://github.com/mrdoob/three.js          |
| React-three-fiber | 一个基于 React 的 3D 渲染库，它将 three.js 的强大渲染能力与 React 的声明式编程模型相结合。使用 react-three-fiber，您可以使用 React 的组件化开发方式来创建复杂的 3D 场景，同时利用 React 的状态管理和生命周期钩子来控制场景的交互和动画。 | https://github.com/pmndrs/react-three-fiber |



## 后端

| 框架  | 说明                                                         | 链接                             |
| ----- | ------------------------------------------------------------ | -------------------------------- |
| gin   | Gin 是一个用 Go (Golang) 编写的 HTTP Web 框架。 它具有类似 Martini 的 API，但性能比 Martini 快 40 倍。 | https://github.com/gin-gonic/gin |
| zap   | Go 中极快、结构化、分级的日志记录。                          | https://github.com/uber-go/zap   |
| viper | Viper 是 Go 应用程序（包括 the_twelve_factors）的完整配置解决方案。 它被设计为在应用程序中工作，可以处理所有类型的配置需求 和格式 | https://github.com/spf13/viper   |

