package service

import (
	"backEnd/utils/algorithm"
)

func Control(objects *algorithm.ArrayObjects) ([]byte, error) {
	bytes, err := objects.Run()

	return bytes, err
}
