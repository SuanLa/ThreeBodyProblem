package algorithm

import "math"

// 定义一个物体结构体
type Object struct {
	Mess     uint64   `json:"Mess"`
	Position Position `json:"Position"`
	Speed    Speed    `json:"Speed"`
	Time     uint64   `json:"Time"`
}

// 定义分解后的速度结构体
type Speed struct {
	XSpeed float64 `json:"XSpeed"`
	YSpeed float64 `json:"YSpeed"`
	ZSpeed float64 `json:"ZSpeed"`
}

// 定义一个位置结构体
type Position struct {
	X float64 `json:"X"`
	Y float64 `json:"Y"`
	Z float64 `json:"Z"`
}

// 每秒更新物体位置的方法
func (o Object) Update(vx, vy, vz float64) Object {
	// 更新速度
	o.Speed.XSpeed = vx
	o.Speed.YSpeed = vy
	o.Speed.ZSpeed = vz

	// 更新物体的位置、质量和方向
	o.Position.X += o.Speed.XSpeed
	o.Position.Y += o.Speed.YSpeed
	o.Position.Z += o.Speed.ZSpeed

	return o
}

// 计算物体绝对速度的方法
func (o *Object) AbsolutionSpeed() float64 {
	speed := math.Sqrt(math.Pow(float64(o.Speed.XSpeed), 2) + math.Pow(float64(o.Speed.YSpeed), 2))
	return math.Sqrt(math.Pow(speed, 2) + math.Pow(float64(o.Speed.ZSpeed), 2))
}
