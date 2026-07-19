// 性能基准实验：吞吐量、天体数扩展性、精度-成本权衡。
// 输出 docs/experiments/performance.md，可直接作为论文表格素材。
// 用法：go run ./cmd/perf -out ../docs/experiments
package main

import (
	"backEnd/utils/algorithm"
	"flag"
	"fmt"
	"log"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const period = 6.32591398

func figure8() []algorithm.Object {
	const px, py = 0.97000436, -0.24308753
	const vx, vy = -0.93240737, -0.86473146
	return []algorithm.Object{
		{Mass: 1, Position: algorithm.Position{X: px, Y: py}, Speed: algorithm.Speed{XSpeed: -vx / 2, YSpeed: -vy / 2}},
		{Mass: 1, Position: algorithm.Position{X: -px, Y: -py}, Speed: algorithm.Speed{XSpeed: -vx / 2, YSpeed: -vy / 2}},
		{Mass: 1, Speed: algorithm.Speed{XSpeed: vx, YSpeed: vy}},
	}
}

func randomSystem(n int, integ algorithm.Integrator) *algorithm.System {
	rng := rand.New(rand.NewSource(42))
	objs := make([]algorithm.Object, n)
	for i := range objs {
		objs[i] = algorithm.Object{
			Mass: 0.5 + rng.Float64(),
			Position: algorithm.Position{
				X: rng.Float64()*4 - 2,
				Y: rng.Float64()*4 - 2,
				Z: rng.Float64()*4 - 2,
			},
		}
	}
	return &algorithm.System{Objects: objs, G: 1, Dt: 1e-3, Softening: 0.01, Integrator: integ}
}

// stepsPerSecond 实测每秒可推进的步数
func stepsPerSecond(sys *algorithm.System) float64 {
	// 预热
	for i := 0; i < 1000; i++ {
		sys.Step()
	}

	const target = 300 * time.Millisecond
	steps := 0
	start := time.Now()
	for time.Since(start) < target {
		for i := 0; i < 200; i++ {
			sys.Step()
		}
		steps += 200
	}
	return float64(steps) / time.Since(start).Seconds()
}

// maxDriftOverPeriod 八字轨道 1 个周期内的能量误差包络最大值
func maxDriftOverPeriod(integ algorithm.Integrator, dt float64) float64 {
	sys := &algorithm.System{Objects: figure8(), G: 1, Dt: dt, Integrator: integ}
	e0 := algorithm.TotalEnergy(sys.Objects, sys.G)
	maxDrift := 0.0
	for i := 0; i < int(period/dt); i++ {
		sys.Step()
		d := math.Abs(algorithm.TotalEnergy(sys.Objects, sys.G)-e0) / math.Abs(e0)
		if math.IsNaN(d) || math.IsInf(d, 0) {
			return math.NaN()
		}
		if d > maxDrift {
			maxDrift = d
		}
	}
	return maxDrift
}

// fitErrorModel 拟合误差模型 err ≈ C·dtᵖ，返回 C 与 p
func fitErrorModel(integ algorithm.Integrator, dts []float64) (c, p float64) {
	var xs, ys []float64
	for _, dt := range dts {
		e := maxDriftOverPeriod(integ, dt)
		if !math.IsNaN(e) && e > 1e-12 {
			xs = append(xs, math.Log(dt))
			ys = append(ys, math.Log(e))
		}
	}
	n := float64(len(xs))
	var sx, sy, sxx, sxy float64
	for i := range xs {
		sx += xs[i]
		sy += ys[i]
		sxx += xs[i] * xs[i]
		sxy += xs[i] * ys[i]
	}
	p = (n*sxy - sx*sy) / (n*sxx - sx*sx)
	c = math.Exp((sy - p*sx) / n)
	return c, p
}

func main() {
	out := flag.String("out", ".", "输出目录")
	flag.Parse()
	if err := os.MkdirAll(*out, 0755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	integrators := []struct {
		name      string
		integ     algorithm.Integrator
		forceEval int // 每步引力求解次数
	}{
		{"Euler", algorithm.Euler{}, 1},
		{"Verlet", algorithm.Verlet{}, 2},
		{"RK4", algorithm.RK4{}, 4},
	}

	var md strings.Builder
	md.WriteString("# 性能基准实验\n\n")
	md.WriteString(fmt.Sprintf("生成时间：%s ｜ 平台：单线程实测 ｜ 场景：八字轨道（N=3，G=1）\n\n", time.Now().Format("2006-01-02 15:04")))

	// 表一：三种积分器吞吐量
	md.WriteString("## 表一：积分器吞吐量（N=3）\n\n")
	md.WriteString("| 积分器 | 每步引力求解次数 | 步/秒 | 单步耗时 | dt=10⁻³ 时每秒推进的仿真时间 |\n")
	md.WriteString("|---|---|---|---|---|\n")
	perStep := map[string]float64{}
	for _, it := range integrators {
		sps := stepsPerSecond(randomSystem(3, it.integ))
		perStep[it.name] = 1 / sps
		md.WriteString(fmt.Sprintf("| %s | %d | %.2e | %.2f µs | %.1f 时间单位 |\n",
			it.name, it.forceEval, sps, 1e6/sps, sps*1e-3))
		fmt.Printf("throughput %-6s: %.3e steps/s\n", it.name, sps)
	}

	// 表二：天体数扩展性（Verlet）
	md.WriteString("\n## 表二：天体数扩展性（Verlet，理论复杂度 O(N²)）\n\n")
	md.WriteString("| N | 步/秒 | 单步耗时 | 相对 N=3 的耗时倍数 | N² 理论倍数 |\n")
	md.WriteString("|---|---|---|---|---|\n")
	ns := []int{3, 10, 30, 100, 300}
	var base float64
	for _, n := range ns {
		sps := stepsPerSecond(randomSystem(n, algorithm.Verlet{}))
		cost := 1 / sps
		if n == 3 {
			base = cost
		}
		md.WriteString(fmt.Sprintf("| %d | %.2e | %.2f µs | ×%.1f | ×%.1f |\n",
			n, sps, cost*1e6, cost/base, float64(n*n)/9))
		fmt.Printf("scaling N=%-4d: %.3e steps/s\n", n, sps)
	}

	// 表三：精度-成本权衡
	md.WriteString("\n## 表三：精度-成本权衡（达到目标能量误差所需的计算量，单周期）\n\n")
	md.WriteString("误差模型 err ≈ C·dtᵖ 由实测拟合（八字轨道单周期误差包络）。\n\n")
	md.WriteString("| 目标误差 | 积分器 | 所需 dt | 步数/周期 | 预计耗时/周期 |\n")
	md.WriteString("|---|---|---|---|---|\n")
	dts := []float64{1e-2, 5e-3, 2e-3, 1e-3, 5e-4}
	type model struct {
		c, p float64
	}
	models := map[string]model{}
	for _, it := range integrators {
		c, p := fitErrorModel(it.integ, dts)
		models[it.name] = model{c, p}
		fmt.Printf("error model %-6s: err ≈ %.3e * dt^%.2f\n", it.name, c, p)
	}
	for _, target := range []float64{1e-4, 1e-6, 1e-8} {
		for _, it := range integrators {
			m := models[it.name]
			dtReq := math.Pow(target/m.c, 1/m.p)
			steps := period / dtReq
			wall := steps * perStep[it.name]
			wallStr := fmt.Sprintf("%.1f ms", wall*1e3)
			if wall > 1 {
				wallStr = fmt.Sprintf("%.1f s", wall)
			}
			if wall > 3600 {
				wallStr = fmt.Sprintf("%.1f h", wall/3600)
			}
			md.WriteString(fmt.Sprintf("| %.0e | %s | %.2e | %.2e | %s |\n",
				target, it.name, dtReq, steps, wallStr))
		}
	}

	md.WriteString("\n> 结论：高阶方法单步更贵（RK4 每步 4 次引力求解），但达到同等精度所需步数呈数量级减少，\n")
	md.WriteString("> 总成本远低于低阶方法；Euler 在高精度目标下的成本增长最快，实用性最差。\n")
	md.WriteString("> 复现方式：`go run ./cmd/perf` 与 `go test -bench . ./utils/algorithm/`。\n")

	path := filepath.Join(*out, "performance.md")
	if err := os.WriteFile(path, []byte(md.String()), 0644); err != nil {
		log.Fatalf("write: %v", err)
	}
	fmt.Println("written:", path)
}
