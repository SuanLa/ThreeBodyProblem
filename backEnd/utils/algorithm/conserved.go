package algorithm

// 系统守恒量计算。理想情况下孤立引力系统的总能量、总动量、
// 总角动量均守恒，其数值漂移程度反映积分方法的误差

// TotalEnergy 总能量 = 动能 Σ½mv² + 引力势能 Σ(-G·mᵢ·mⱼ/dᵢⱼ)
func TotalEnergy(objs []Object, g float64) float64 {
	e := 0.0
	for i := range objs {
		v := objs[i].Vel()
		e += 0.5 * objs[i].Mass * v.Dot(v)
	}
	for i := 0; i < len(objs); i++ {
		for j := i + 1; j < len(objs); j++ {
			d := objs[j].Pos().Sub(objs[i].Pos()).Norm()
			if d > 0 {
				e -= g * objs[i].Mass * objs[j].Mass / d
			}
		}
	}
	return e
}

// TotalMomentum 总动量 Σ m·v
func TotalMomentum(objs []Object) Vec3 {
	var p Vec3
	for i := range objs {
		p = p.Add(objs[i].Vel().Scale(objs[i].Mass))
	}
	return p
}

// TotalAngularMomentum 总角动量 Σ m·(r × v)
func TotalAngularMomentum(objs []Object) Vec3 {
	var l Vec3
	for i := range objs {
		l = l.Add(objs[i].Pos().Cross(objs[i].Vel()).Scale(objs[i].Mass))
	}
	return l
}
