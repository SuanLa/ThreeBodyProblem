package algorithm

import (
	"math/rand"
	"testing"
)

// 固定种子的随机 N 体系统，保证基准可复现
func randomSystem(n int, integ Integrator) *System {
	rng := rand.New(rand.NewSource(42))
	objs := make([]Object, n)
	for i := range objs {
		objs[i] = Object{
			Mass: 0.5 + rng.Float64(),
			Position: Position{
				X: rng.Float64()*4 - 2,
				Y: rng.Float64()*4 - 2,
				Z: rng.Float64()*4 - 2,
			},
			Speed: Speed{
				XSpeed: rng.Float64()*0.2 - 0.1,
				YSpeed: rng.Float64()*0.2 - 0.1,
				ZSpeed: rng.Float64()*0.2 - 0.1,
			},
		}
	}
	return &System{Objects: objs, G: 1, Dt: 1e-3, Softening: 0.01, Integrator: integ}
}

func benchStep(b *testing.B, integ Integrator, n int) {
	sys := randomSystem(n, integ)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		sys.Step()
	}
}

// 三种积分器在三体问题上的单步耗时
func BenchmarkEulerN3(b *testing.B)  { benchStep(b, Euler{}, 3) }
func BenchmarkVerletN3(b *testing.B) { benchStep(b, Verlet{}, 3) }
func BenchmarkRK4N3(b *testing.B)    { benchStep(b, RK4{}, 3) }

// 天体数扩展性：引力计算为两两成对，理论复杂度 O(N²)
func BenchmarkVerletN10(b *testing.B)  { benchStep(b, Verlet{}, 10) }
func BenchmarkVerletN30(b *testing.B)  { benchStep(b, Verlet{}, 30) }
func BenchmarkVerletN100(b *testing.B) { benchStep(b, Verlet{}, 100) }
func BenchmarkVerletN300(b *testing.B) { benchStep(b, Verlet{}, 300) }
