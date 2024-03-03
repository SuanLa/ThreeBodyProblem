package algorithm

type ArrayObjects struct {
	objects []Object
}

func (ao *ArrayObjects) GetObjects() []Object {
	return ao.objects
}

//TODO 开启协程和通道处理数据

func (ao *ArrayObjects) Add(obj Object) {

}
