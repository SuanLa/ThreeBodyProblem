package fileGenerator

import (
	"fmt"
	"os"
	"path/filepath"
	_ "strings"
	"time"
)

func FileGenerator(path string) error {
	dir := filepath.Dir(path)
	filename := filepath.Base(path)

	// 创建路径
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		fmt.Printf("创建路径失败: %v\n", err)
		return err
	}
	fmt.Printf("路径 %s 创建成功\n", dir)

	// 获取当前时间
	year, month, day := time.Now().Date()
	date := fmt.Sprintf("%d-%02d-%02d", year, month, day)

	// 创建文件
	file, err := os.Create(dir + "/" + filename + "." + date)
	if err != nil {
		fmt.Printf("创建文件失败: %v\n", err)
		return err
	}
	defer file.Close()

	return nil
}
