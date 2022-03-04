package config

import (
	"os"
)

var ProjectRootPath string

func init() {
	var err error
	ProjectRootPath, err = os.Getwd()
	if err != nil {
		panic(err)
	}
}
