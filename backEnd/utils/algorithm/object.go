package algorithm

import "math"

// 定义一个物体结构体
type Object struct {
	Quality  uint64   `json:"quality"`
	Position Position `json:"position"`
	Speed    Speed    `json:"speed"`
	Time     uint64   `json:"time"`
}

// 定义分解后的速度结构体
type Speed struct {
	XSpeed int64 `json:"XSpeed"`
	YSpeed int64 `json:"YSpeed"`
	ZSpeed int64 `json:"ZSpeed"`
}

// 定义一个位置结构体
type Position struct {
	X int64 `json:"X"`
	Y int64 `json:"Y"`
	Z int64 `json:"Z"`
}

// 每秒更新物体位置的方法
func (o Object) Update(vx, vy, vz int64) {
	// 更新速度
	o.Speed.XSpeed = vx
	o.Speed.YSpeed = vy
	o.Speed.ZSpeed = vz

	// 更新物体的位置、质量和方向
	o.Position.X += o.Speed.XSpeed
	o.Position.Y += o.Speed.YSpeed
	o.Position.Z += o.Speed.ZSpeed
}

// 计算物体绝对速度的方法
func (o *Object) AbsolutionSpeed() float64 {
	speed := math.Sqrt(math.Pow(float64(o.Speed.XSpeed), 2) + math.Pow(float64(o.Speed.YSpeed), 2))
	return math.Sqrt(math.Pow(speed, 2) + math.Pow(float64(o.Speed.ZSpeed), 2))
}
