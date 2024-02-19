package logger

import (
	"backEnd/utils/fileCreater"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
	"os"
)

var Business *zap.Logger

func NewBusiness() {
	path = viper.GetString("log.path.business")
	stat, err := os.Stat(path)
	if os.IsNotExist(err) || (stat != nil && stat.IsDir()) {
		err := fileCreater.FileGenerator(path)
		if err != nil {
			log.Fatal("Failed to create business log file:", err)
		}
	}

	Business, err = businessLogger()
	if err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
}

func businessLogger() (*zap.Logger, error) {
	config := zap.Config{
		Encoding: "json",
		Level:    zap.NewAtomicLevelAt(zap.InfoLevel),
		EncoderConfig: zapcore.EncoderConfig{
			TimeKey:        "time",
			LevelKey:       "level",
			NameKey:        "logger",
			CallerKey:      "caller",
			MessageKey:     "msg",
			StacktraceKey:  "stacktrace",
			LineEnding:     zapcore.DefaultLineEnding,
			EncodeLevel:    zapcore.LowercaseLevelEncoder,
			EncodeTime:     zapcore.ISO8601TimeEncoder, // ISO8601格式的时间编码器
			EncodeDuration: zapcore.SecondsDurationEncoder,
			EncodeCaller:   zapcore.ShortCallerEncoder,
		},
		OutputPaths:      []string{"stdout", viper.GetString("log.path.business")},
		ErrorOutputPaths: []string{"error.log"},
	}

	build, err := config.Build()

	// 确保在函数退出时同步日志
	defer build.Sync()

	return build, err // 返回一个Logger实例
}
