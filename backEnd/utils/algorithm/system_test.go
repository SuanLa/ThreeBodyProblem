package algorithm

import (
	"math"
	"testing"
)

// 等质量两体圆轨道（G=1）：m=1，间距 d=2，圆轨道速度 v=sqrt(G*m/(2d))=0.5，
// 周期 T = 2π·(d/2)/v = 4π
func circularPair() []Object {
	return []Object{
		{Mass: 1, Position: Position{X: -1}, Speed: Speed{YSpeed: -0.5}},
		{Mass: 1, Position: Position{X: 1}, Speed: Speed{YSpeed: 0.5}},
	}
}

// Chenciner-Montgomery 八字轨道标准初值（G=1，m=1），周期 T≈6.32591398
func figure8() []Object {
	const px, py = 0.97000436, -0.24308753
	const vx, vy = -0.93240737, -0.86473146
	return []Object{
		{Mass: 1, Position: Position{X: px, Y: py}, Speed: Speed{XSpeed: -vx / 2, YSpeed: -vy / 2}},
		{Mass: 1, Position: Position{X: -px, Y: -py}, Speed: Speed{XSpeed: -vx / 2, YSpeed: -vy / 2}},
		{Mass: 1, Position: Position{}, Speed: Speed{XSpeed: vx, YSpeed: vy}},
	}
}

// relEnergyDrift 用给定积分器把两体圆轨道推进一个周期，返回相对能量漂移
func relEnergyDrift(t *testing.T, integrator Integrator, dt float64) float64 {
	t.Helper()

	sys := &System{Objects: circularPair(), G: 1, Dt: dt, Integrator: integrator}
	e0 := TotalEnergy(sys.Objects, sys.G)

	steps := int(4 * math.Pi / dt)
	for i := 0; i < steps; i++ {
		sys.Step()
	}

	e1 := TotalEnergy(sys.Objects, sys.G)
	return math.Abs(e1-e0) / math.Abs(e0)
}

func TestEnergyConservationOrdering(t *testing.T) {
	const dt = 1e-3

	euler := relEnergyDrift(t, Euler{}, dt)
	verlet := relEnergyDrift(t, Verlet{}, dt)
	rk4 := relEnergyDrift(t, RK4{}, dt)

	t.Logf("relative energy drift over one orbit: euler=%.3e verlet=%.3e rk4=%.3e", euler, verlet, rk4)

	if verlet > 1e-4 {
		t.Errorf("verlet energy drift too large: %.3e", verlet)
	}
	if rk4 > 1e-6 {
		t.Errorf("rk4 energy drift too large: %.3e", rk4)
	}
	// 显式欧拉能量单调漂移，应显著差于辛积分器
	if euler <= verlet {
		t.Errorf("expected euler drift (%.3e) to exceed verlet drift (%.3e)", euler, verlet)
	}
	if euler > 0.1 {
		t.Errorf("euler drift unreasonably large, integration likely broken: %.3e", euler)
	}
}

func TestFigure8ReturnsAfterOnePeriod(t *testing.T) {
	const period = 6.32591398
	dt := 1e-3

	sys := &System{Objects: figure8(), G: 1, Dt: dt, Integrator: RK4{}}
	e0 := TotalEnergy(sys.Objects, sys.G)

	start := make([]Vec3, len(sys.Objects))
	for i := range sys.Objects {
		start[i] = sys.Objects[i].Pos()
	}

	steps := int(period / dt)
	for i := 0; i < steps; i++ {
		sys.Step()
	}

	// 一个周期后各天体应回到初始位置附近
	for i := range sys.Objects {
		if d := sys.Objects[i].Pos().Sub(start[i]).Norm(); d > 2e-2 {
			t.Errorf("object %d did not return to start, distance %.4f", i, d)
		}
	}

	drift := math.Abs(TotalEnergy(sys.Objects, sys.G)-e0) / math.Abs(e0)
	if drift > 1e-8 {
		t.Errorf("figure-8 energy drift too large: %.3e", drift)
	}
}

func TestMomentumConservation(t *testing.T) {
	integrators := []Integrator{Euler{}, Verlet{}, RK4{}}

	for _, integ := range integrators {
		objs := []Object{
			{Mass: 3, Position: Position{X: 1, Y: 2, Z: -1}, Speed: Speed{XSpeed: 0.1}},
			{Mass: 1, Position: Position{X: -2, Y: 0.5, Z: 1}, Speed: Speed{YSpeed: -0.2}},
			{Mass: 2, Position: Position{Y: -1, Z: 2}, Speed: Speed{ZSpeed: 0.05}},
		}
		// 软化项避免近距离交会导致数值发散，不影响动量守恒
		sys := &System{Objects: objs, G: 1, Dt: 5e-3, Softening: 0.05, Integrator: integ}

		p0 := TotalMomentum(sys.Objects)
		for i := 0; i < 2000; i++ {
			sys.Step()
		}
		p1 := TotalMomentum(sys.Objects)

		if diff := p1.Sub(p0).Norm(); diff > 1e-9 {
			t.Errorf("%s: momentum not conserved, drift %.3e", integ.Name(), diff)
		}
	}
}

func TestArrayObjectsRemove(t *testing.T) {
	ao := &ArrayObjects{}
	ao.Add(Object{Mass: 1})
	ao.Add(Object{Mass: 2})
	ao.Add(Object{Mass: 3})

	ao.Remove(1)

	if len(ao.Objects) != 2 {
		t.Fatalf("expected 2 objects after remove, got %d", len(ao.Objects))
	}
	if ao.Objects[0].Mass != 1 || ao.Objects[1].Mass != 3 {
		t.Errorf("unexpected objects after remove: %+v", ao.Objects)
	}

	// 越界删除不应 panic 或改变数组
	ao.Remove(-1)
	ao.Remove(5)
	if len(ao.Objects) != 2 {
		t.Errorf("out-of-range remove changed the array: %d", len(ao.Objects))
	}
}
