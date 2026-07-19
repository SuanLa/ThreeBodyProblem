# <div align='center'>Three Body Problem</div>

<div align='center'> <img src="https://github.com/SuanLa/ThreeBodyProblem/blob/main/front/public/fav.png"></div>

三体问题的数值仿真与可视化系统。后端用 Go 实现 N 体引力计算内核（支持多种数值积分方法），通过 WebSocket 协议将仿真状态实时推送前端；前端基于 React + Three.js 渲染三维场景，并提供完整的仿真控制、守恒量监测与数值实验能力。

## 功能特性

- **物理内核**：显式欧拉 / 速度 Verlet（辛积分器，默认）/ RK4 三种积分方法可实时切换；引力常数 G、时间步长 dt、软化项均可配置；总能量、动量、角动量守恒经单元测试验证
- **经典预设**：Chenciner-Montgomery 八字轨道、拉格朗日等边三角形周期解、带约束的随机初值（总动量归零、总能量为负），一键加载
- **播放控制**：播放/暂停、单步推进、0.25x–4x 倍速、重置、时间轴回溯（可拖回任意历史时刻并从该处继续仿真）
- **守恒量监测**：实时绘制总能量（含 ΔE/E₀ 漂移指标）、动量与角动量、天体间距曲线
- **混沌对比**：一键克隆当前初值并加 10⁻⁶ 扰动，孪生系统以半透明幽灵形态同步演化，轨迹分离距离 δ 以对数刻度实时绘制——直观演示对初值的敏感依赖
- **方案与回放**：参数方案本地保存 / JSON 导入导出；仿真过程可录制导出，离线回放不依赖后端
- **多客户端**：每条 WebSocket 连接持有独立仿真会话，互不干扰

## 快速开始

后端（Go 1.21+，默认端口 6750）：

```bash
cd backEnd
go run .
```

前端（Node 18+）：

```bash
cd front
npm install
npm start
```

打开 `http://localhost:3000`，在设置页选择预设或自定义参数，进入展示页点击播放。

## 通信协议

前后端通过 WebSocket（`/v1/track`）交换 JSON 协议。核心字段：

| 字段 | 说明 |
|---|---|
| `star` | 会话控制，false 表示停止 |
| `Objects` / `TwinObjects` | 主 / 孪生系统的天体数组（质量、位置、速度） |
| `G` / `Dt` / `Method` / `Softening` | 仿真参数（可选，缺省用后端默认值） |
| `Cmd` | 播放指令：`pause` / `resume` / `step` / `speed`；空表示全量启动 |
| `SleepTime` / `StepsPerPush` | 推送间隔（10ms 单位）与每帧推进步数（倍速） |

## 数值实验

`docs/experiments/` 内含可复现的实验素材（数据 CSV + 可直接浏览的图表页）：

| 实验 | 复现命令 | 核心结果 |
|---|---|---|
| 长期能量漂移 | `go run ./cmd/energydrift` | 八字轨道 10 周期：Euler 2×10⁻¹，Verlet 2.6×10⁻¹⁰（有界不漂移），RK4 2.6×10⁻¹³ |
| 收敛阶分析 | 同上 | 实测收敛阶 Euler ≈1、Verlet =2、RK4 ≈4，与理论一致 |
| 性能基准 | `go run ./cmd/perf`、`go test -bench . ./utils/algorithm/` | 单步 63ns–235ns（N=3）；O(N²) 扩展性实验确认；误差 10⁻⁸ 成本：Euler 4.3h vs Verlet 4.7ms vs RK4 0.1ms |
| 混沌敏感性 | 应用内"混沌对比"开关 | 10⁻⁶ 初值扰动在强混沌构型下 3 个时间单位放大 ~10⁷ 倍 |

单元测试以物理定律为断言（两体圆轨道能量守恒、八字轨道周期回归、动量守恒）：

```bash
cd backEnd
go test ./...
```

## 技术栈

| 端 | 框架 | 用途 |
|---|---|---|
| 前端 | [React](https://github.com/facebook/react) | 界面框架 |
| 前端 | [Three.js](https://github.com/mrdoob/three.js) / [react-three-fiber](https://github.com/pmndrs/react-three-fiber) / [drei](https://github.com/pmndrs/drei) | WebGL 三维渲染 |
| 前端 | [MUI](https://github.com/mui/material-ui) | 组件库 |
| 后端 | [gin](https://github.com/gin-gonic/gin) | HTTP 框架 |
| 后端 | [gorilla/websocket](https://github.com/gorilla/websocket) | WebSocket |
| 后端 | [zap](https://github.com/uber-go/zap) / [viper](https://github.com/spf13/viper) | 结构化日志 / 配置管理 |

## 目录结构

```
backEnd/
  api/  router/  middleware/  service/     # Web 层
  utils/algorithm/                         # 物理内核：向量、系统、积分器、守恒量（含测试与基准）
  utils/ws/  utils/protocol/               # WebSocket 会话与协议
  cmd/energydrift/  cmd/perf/              # 数值实验程序
front/src/
  router/                                  # 设置页（预设/方案管理）、展示页（播放控制/回放）
  component/                               # 天体、轨道控制器、守恒量面板
  physics/  presets/  store/               # 守恒量计算、经典预设、方案持久化
docs/experiments/                          # 实验数据与图表页
```
