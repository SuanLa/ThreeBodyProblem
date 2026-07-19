// 积分器能量漂移对比实验。
//
// 实验一（长期漂移）：八字轨道跑 10 个周期，采样各积分器的相对能量误差 |ΔE/E₀| 随时间变化；
// 实验二（收敛阶）：固定跑 1 个周期，扫描时间步长 dt，测末端能量误差随 dt 的收敛速度。
//
// 输出 CSV（可导入 Excel/Origin）与 data.js（供 energy-drift.html 绘图）。
// 用法：go run ./cmd/energydrift -out ../docs/experiments
package main

import (
	"backEnd/utils/algorithm"
	"flag"
	"fmt"
	"log"
	"math"
	"os"
	"path/filepath"
	"strings"
)

// 八字轨道周期（Chenciner-Montgomery）
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

type series struct {
	name   string
	integ  algorithm.Integrator
	ts     []float64
	drifts []float64
}

// runDrift 以步长 dt 推进至 tEnd，每隔 sampleEvery 采样一次相对能量误差。
// 数值发散（NaN/Inf）时提前截断
func runDrift(integ algorithm.Integrator, dt, tEnd, sampleEvery float64) (ts, drifts []float64) {
	sys := &algorithm.System{Objects: figure8(), G: 1, Dt: dt, Integrator: integ}
	e0 := algorithm.TotalEnergy(sys.Objects, sys.G)

	steps := int(tEnd / dt)
	sampleSteps := int(sampleEvery / dt)
	if sampleSteps < 1 {
		sampleSteps = 1
	}

	for i := 1; i <= steps; i++ {
		sys.Step()
		if i%sampleSteps == 0 {
			e := algorithm.TotalEnergy(sys.Objects, sys.G)
			d := math.Abs(e-e0) / math.Abs(e0)
			if math.IsNaN(d) || math.IsInf(d, 0) {
				return ts, drifts
			}
			ts = append(ts, float64(i)*dt)
			drifts = append(drifts, d)
		}
	}
	return ts, drifts
}

// maxDriftOverPeriod 返回 1 个周期内相对能量误差的最大值（误差包络）。
// 不用周期末端值：八字轨道高度对称，辛积分器的能量误差在轨道闭合处
// 大幅抵消，末端值会虚高收敛阶
func maxDriftOverPeriod(integ algorithm.Integrator, dt float64) float64 {
	sys := &algorithm.System{Objects: figure8(), G: 1, Dt: dt, Integrator: integ}
	e0 := algorithm.TotalEnergy(sys.Objects, sys.G)

	maxDrift := 0.0
	steps := int(period / dt)
	for i := 0; i < steps; i++ {
		sys.Step()
		e := algorithm.TotalEnergy(sys.Objects, sys.G)
		d := math.Abs(e-e0) / math.Abs(e0)
		if math.IsNaN(d) || math.IsInf(d, 0) {
			return math.NaN()
		}
		if d > maxDrift {
			maxDrift = d
		}
	}
	return maxDrift
}

func writeFile(dir, name, content string) {
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		log.Fatalf("write %s: %v", path, err)
	}
	fmt.Println("written:", path)
}

func main() {
	out := flag.String("out", ".", "输出目录")
	flag.Parse()

	if err := os.MkdirAll(*out, 0755); err != nil {
		log.Fatalf("mkdir %s: %v", *out, err)
	}

	all := []series{
		{name: "euler", integ: algorithm.Euler{}},
		{name: "verlet", integ: algorithm.Verlet{}},
		{name: "rk4", integ: algorithm.RK4{}},
	}

	// 实验一：dt=1e-3，10 个周期，每 0.05 时间单位采样
	const dt = 1e-3
	for i := range all {
		all[i].ts, all[i].drifts = runDrift(all[i].integ, dt, 10*period, 0.05)
		last := all[i].drifts[len(all[i].drifts)-1]
		fmt.Printf("%-6s 10 periods: final |dE/E0| = %.3e (%d samples)\n", all[i].name, last, len(all[i].drifts))
	}

	var csv1 strings.Builder
	csv1.WriteString("t,euler,verlet,rk4\n")
	for i := range all[0].ts {
		csv1.WriteString(fmt.Sprintf("%.3f", all[0].ts[i]))
		for _, s := range all {
			if i < len(s.drifts) {
				csv1.WriteString(fmt.Sprintf(",%.6e", s.drifts[i]))
			} else {
				csv1.WriteString(",")
			}
		}
		csv1.WriteString("\n")
	}
	writeFile(*out, "drift_vs_time.csv", csv1.String())

	// 实验二：1 个周期内误差包络最大值随 dt 变化
	dts := []float64{1e-2, 5e-3, 2e-3, 1e-3, 5e-4}
	conv := map[string][]float64{}
	for _, s := range all {
		for _, d := range dts {
			conv[s.name] = append(conv[s.name], maxDriftOverPeriod(s.integ, d))
		}
	}

	var csv2 strings.Builder
	csv2.WriteString("dt,euler,verlet,rk4\n")
	for i, d := range dts {
		csv2.WriteString(fmt.Sprintf("%.0e,%.6e,%.6e,%.6e\n", d, conv["euler"][i], conv["verlet"][i], conv["rk4"][i]))
	}
	writeFile(*out, "convergence.csv", csv2.String())

	// 收敛阶估计：对舍入地板（<1e-12）以上的点做最小二乘对数斜率拟合
	fmt.Println("\nestimated convergence order (least squares, drift > 1e-12):")
	for _, s := range all {
		p := fitOrder(dts, conv[s.name])
		fmt.Printf("%-6s order ≈ %.2f\n", s.name, p)
	}

	// data.js 供图表页使用
	var js strings.Builder
	js.WriteString("// 由 go run ./cmd/energydrift 生成，请勿手改\n")
	js.WriteString("window.DRIFT = {\n")
	for _, s := range all {
		js.WriteString(fmt.Sprintf("  %s: {t: %s, v: %s},\n", s.name, jsArray(s.ts, "%.3f"), jsArray(s.drifts, "%.4e")))
	}
	js.WriteString("};\n")
	js.WriteString(fmt.Sprintf("window.CONVERGENCE = {dts: %s", jsArray(dts, "%.0e")))
	for _, s := range all {
		js.WriteString(fmt.Sprintf(", %s: %s", s.name, jsArray(conv[s.name], "%.4e")))
	}
	js.WriteString("};\n")
	js.WriteString(fmt.Sprintf("window.PERIOD = %.8f;\n", period))
	writeFile(*out, "data.js", js.String())
}

// fitOrder 在 log(dt)-log(err) 平面做最小二乘拟合，返回斜率（即收敛阶）。
// 已落入浮点舍入地板的数据点（err < 1e-12）不参与拟合
func fitOrder(dts, errs []float64) float64 {
	var xs, ys []float64
	for i := range dts {
		if !math.IsNaN(errs[i]) && errs[i] > 1e-12 {
			xs = append(xs, math.Log(dts[i]))
			ys = append(ys, math.Log(errs[i]))
		}
	}
	n := float64(len(xs))
	if n < 2 {
		return math.NaN()
	}

	var sx, sy, sxx, sxy float64
	for i := range xs {
		sx += xs[i]
		sy += ys[i]
		sxx += xs[i] * xs[i]
		sxy += xs[i] * ys[i]
	}
	return (n*sxy - sx*sy) / (n*sxx - sx*sx)
}

func jsArray(vals []float64, format string) string {
	parts := make([]string, len(vals))
	for i, v := range vals {
		parts[i] = fmt.Sprintf(format, v)
	}
	return "[" + strings.Join(parts, ",") + "]"
}
