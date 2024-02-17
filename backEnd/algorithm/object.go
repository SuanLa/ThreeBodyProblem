package algorithm

import "math"

// 定义一个物体结构体
type Object struct {
	quality  uint64
	position Position
	speed    Speed
	time     uint64
}

// 定义分解后的速度结构体
type Speed struct {
	xSpeed int64
	ySpeed int64
	zSpeed int64
}

// 定义一个位置结构体
type Position struct {
	x int64
	y int64
	z int64
}

// 每秒更新物体位置的方法
func (o *Object) Update() {
	// 更新物体的位置、质量和方向
	o.position.x += o.speed.xSpeed
	o.position.y += o.speed.ySpeed
	o.position.z += o.speed.zSpeed
}

// 计算物体绝对速度的方法
func (o *Object) AbsolutionSpeed() float64 {
	speed := math.Sqrt(math.Pow(float64(o.speed.xSpeed), 2) + math.Pow(float64(o.speed.ySpeed), 2))
	return math.Sqrt(math.Pow(speed, 2) + math.Pow(float64(o.speed.zSpeed), 2))
}
