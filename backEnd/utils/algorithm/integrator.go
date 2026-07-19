package algorithm

import (
	"fmt"
	"strings"
)

// Integrator 数值积分器接口，就地将所有物体推进一个时间步
type Integrator interface {
	Name() string
	Step(objs []Object, g, softening, dt float64)
}

// NewIntegrator 根据名称构造积分器，空字符串取默认的 verlet
func NewIntegrator(name string) (Integrator, error) {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "", "verlet":
		return Verlet{}, nil
	case "euler":
		return Euler{}, nil
	case "rk4":
		return RK4{}, nil
	default:
		return nil, fmt.Errorf("unknown integrator %q", name)
	}
}

// addScaled 返回 base[i] + delta[i]*s 的新切片
func addScaled(base, delta []Vec3, s float64) []Vec3 {
	out := make([]Vec3, len(base))
	for i := range base {
		out[i] = base[i].Add(delta[i].Scale(s))
	}
	return out
}

// Euler 显式欧拉法。一阶精度，能量随时间单调漂移，作为对比基线
type Euler struct{}

func (Euler) Name() string { return "euler" }

func (Euler) Step(objs []Object, g, softening, dt float64) {
	masses, pos, vel := snapshot(objs)
	acc := accelerations(masses, pos, g, softening)
	for i := range objs {
		objs[i].SetPos(pos[i].Add(vel[i].Scale(dt)))
		objs[i].SetVel(vel[i].Add(acc[i].Scale(dt)))
	}
}

// Verlet 速度 Verlet 法。二阶精度的辛积分器，长期能量误差有界不漂移，
// 是天体力学仿真的常用选择，也是本系统的默认积分器
type Verlet struct{}

func (Verlet) Name() string { return "verlet" }

func (Verlet) Step(objs []Object, g, softening, dt float64) {
	masses, pos, vel := snapshot(objs)
	acc := accelerations(masses, pos, g, softening)

	// x(t+dt) = x + v*dt + a*dt²/2
	newPos := make([]Vec3, len(objs))
	for i := range objs {
		newPos[i] = pos[i].Add(vel[i].Scale(dt)).Add(acc[i].Scale(0.5 * dt * dt))
	}

	// v(t+dt) = v + (a(t)+a(t+dt))*dt/2
	newAcc := accelerations(masses, newPos, g, softening)
	for i := range objs {
		objs[i].SetPos(newPos[i])
		objs[i].SetVel(vel[i].Add(acc[i].Add(newAcc[i]).Scale(0.5 * dt)))
	}
}

// RK4 经典四阶龙格-库塔法。单步精度最高，但非辛，超长时间能量缓慢漂移
type RK4 struct{}

func (RK4) Name() string { return "rk4" }

func (RK4) Step(objs []Object, g, softening, dt float64) {
	masses, pos, vel := snapshot(objs)

	accAt := func(p []Vec3) []Vec3 {
		return accelerations(masses, p, g, softening)
	}

	v1 := vel
	a1 := accAt(pos)

	v2 := addScaled(vel, a1, dt/2)
	a2 := accAt(addScaled(pos, v1, dt/2))

	v3 := addScaled(vel, a2, dt/2)
	a3 := accAt(addScaled(pos, v2, dt/2))

	v4 := addScaled(vel, a3, dt)
	a4 := accAt(addScaled(pos, v3, dt))

	for i := range objs {
		dp := v1[i].Add(v2[i].Scale(2)).Add(v3[i].Scale(2)).Add(v4[i]).Scale(dt / 6)
		dv := a1[i].Add(a2[i].Scale(2)).Add(a3[i].Scale(2)).Add(a4[i]).Scale(dt / 6)
		objs[i].SetPos(pos[i].Add(dp))
		objs[i].SetVel(vel[i].Add(dv))
	}
}
