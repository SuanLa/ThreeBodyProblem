package algorithm

import "math"

// System 表示一个 N 体仿真系统的完整状态与参数
type System struct {
	Objects    []Object
	G          float64 // 引力常数
	Dt         float64 // 积分时间步长
	Softening  float64 // 引力软化项，避免两体过近时力发散，0 表示关闭
	Integrator Integrator
}

// Step 将系统推进一个时间步
func (s *System) Step() {
	s.Integrator.Step(s.Objects, s.G, s.Softening, s.Dt)
	for i := range s.Objects {
		s.Objects[i].Time += s.Dt
	}
}

// snapshot 提取物体列表的质量、位置、速度快照
func snapshot(objs []Object) (masses []float64, pos, vel []Vec3) {
	masses = make([]float64, len(objs))
	pos = make([]Vec3, len(objs))
	vel = make([]Vec3, len(objs))
	for i := range objs {
		masses[i] = objs[i].Mass
		pos[i] = objs[i].Pos()
		vel[i] = objs[i].Vel()
	}
	return masses, pos, vel
}

// accelerations 依据同一份位置快照计算所有物体的引力加速度。
// 成对计算并对称累加，保证作用力与反作用力严格相等，总动量守恒。
// softening 为软化长度 ε，等效把距离替换为 sqrt(d²+ε²)
func accelerations(masses []float64, pos []Vec3, g, softening float64) []Vec3 {
	acc := make([]Vec3, len(pos))
	for i := 0; i < len(pos); i++ {
		for j := i + 1; j < len(pos); j++ {
			r := pos[j].Sub(pos[i])
			d2 := r.Dot(r) + softening*softening
			if d2 == 0 {
				continue
			}
			inv := 1 / (d2 * math.Sqrt(d2))
			acc[i] = acc[i].Add(r.Scale(g * masses[j] * inv))
			acc[j] = acc[j].Add(r.Scale(-g * masses[i] * inv))
		}
	}
	return acc
}

// Accelerations 计算当前物体列表中每个物体受到的合加速度
func Accelerations(objs []Object, g, softening float64) []Vec3 {
	masses, pos, _ := snapshot(objs)
	return accelerations(masses, pos, g, softening)
}
