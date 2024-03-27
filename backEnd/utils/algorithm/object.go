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
func (o Object) Update(ax, ay, az float64) Object {
	// 计算末速度
	vx := o.Speed.XSpeed + ax*Time
	vy := o.Speed.YSpeed + ay*Time
	vz := o.Speed.ZSpeed + az*Time

	// 计算平均速度
	avgX := (vx + o.Speed.XSpeed) / 2
	avgY := (vy + o.Speed.YSpeed) / 2
	avgZ := (vz + o.Speed.ZSpeed) / 2

	// 更新速度
	o.Speed.XSpeed = vx
	o.Speed.YSpeed = vy
	o.Speed.ZSpeed = vz

	// 更新物体的位置
	o.Position.X += avgX * Time
	o.Position.Y += avgY * Time
	o.Position.Z += avgZ * Time

	return o
}

// 计算物体绝对速度的方法
func (o *Object) AbsolutionSpeed() float64 {
	speed := math.Sqrt(math.Pow(float64(o.Speed.XSpeed), 2) + math.Pow(float64(o.Speed.YSpeed), 2))
	return math.Sqrt(math.Pow(speed, 2) + math.Pow(float64(o.Speed.ZSpeed), 2))
}
