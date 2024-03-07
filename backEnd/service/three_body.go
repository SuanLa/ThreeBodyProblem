package service

import (
	"backEnd/utils/algorithm"
)

func Control(objects *algorithm.ArrayObjects) []byte {
	for _, val := range objects.GetObjects() {
		// TODO 实现物体之间的数据传递
		go val.Update()
	}
	return nil
}
