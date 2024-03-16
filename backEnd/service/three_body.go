package service

import (
	"backEnd/utils/algorithm"
)

func Control(objects *algorithm.ArrayObjects) (algorithm.ArrayObjects, error) {
	ao, err := objects.Run()

	return ao, err
}
