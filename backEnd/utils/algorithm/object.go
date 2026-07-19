package algorithm

// 定义一个物体结构体。json tag 与前端协议保持兼容（历史原因质量字段名为 Mess）
type Object struct {
	Mass     float64  `json:"Mess"`
	Position Position `json:"Position"`
	Speed    Speed    `json:"Speed"`
	Time     float64  `json:"Time"`
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

// 位置的向量视图
func (o *Object) Pos() Vec3 {
	return Vec3{o.Position.X, o.Position.Y, o.Position.Z}
}

// 速度的向量视图
func (o *Object) Vel() Vec3 {
	return Vec3{o.Speed.XSpeed, o.Speed.YSpeed, o.Speed.ZSpeed}
}

func (o *Object) SetPos(v Vec3) {
	o.Position = Position{X: v.X, Y: v.Y, Z: v.Z}
}

func (o *Object) SetVel(v Vec3) {
	o.Speed = Speed{XSpeed: v.X, YSpeed: v.Y, ZSpeed: v.Z}
}

// 计算物体绝对速度的方法
func (o *Object) AbsolutionSpeed() float64 {
	return o.Vel().Norm()
}

// 协议中的物体数组容器
type ArrayObjects struct {
	Objects []Object `json:"objects"`
}

func (ao *ArrayObjects) GetObjects() []Object {
	return ao.Objects
}

// 添加物体到数组的方法
func (ao *ArrayObjects) Add(obj Object) {
	ao.Objects = append(ao.Objects, obj)
}

// 移除物体的方法
func (ao *ArrayObjects) Remove(index int) {
	if index < 0 || index >= len(ao.Objects) {
		return
	}
	ao.Objects = append(ao.Objects[:index], ao.Objects[index+1:]...)
}
