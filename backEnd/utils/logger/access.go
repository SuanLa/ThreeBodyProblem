package logger

import (
	"backEnd/utils/fileGenerator"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
	"os"
)

var (
	Access    *zap.Logger
	path      string
	errorPath string
)

func NewAccess() {
	path = viper.GetString("log.path.access")
	stat, err := os.Stat(path)
	if os.IsNotExist(err) || (stat != nil && stat.IsDir()) {
		err := fileGenerator.FileGenerator(path)
		if err != nil {
			log.Fatal("Failed to create access log file:", err)
		}
	}

	errorPath = viper.GetString("log.path.error")
	stat, err = os.Stat(errorPath)
	if os.IsNotExist(err) || (stat != nil && stat.IsDir()) {
		err := fileGenerator.FileGenerator(errorPath)
		if err != nil {
			log.Fatal("Failed to create access log file:", err)
		}
	}

	Access, err = accessLogger()
	if err != nil {
		log.Fatal("Failed to initialize access logger:", err)
	}

	defer Access.Sync()
}

func accessLogger() (*zap.Logger, error) {
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
		OutputPaths:      []string{"stdout", path},
		ErrorOutputPaths: []string{errorPath},
	}

	return config.Build() // 返回一个Logger实例
}
