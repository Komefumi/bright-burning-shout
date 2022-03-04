package ui

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/Komefumi/bright-burning-shout/config"
	"github.com/fsnotify/fsnotify"
)

var ProjectRootPath string

type PathMapping struct {
	Pages         string
	Styles        string
	ModuleEntries string
}

var SrcPathMapping PathMapping
var DistPathMapping PathMapping

func init() {
	var err error
	ProjectRootPath, err = os.Getwd()
	if err != nil {
		panic(err)
	}

	srcPath := filepath.Join(ProjectRootPath, "src")
	distPath := filepath.Join(ProjectRootPath, "dist")

	SrcPathMapping = PathMapping{
		Pages:         filepath.Join(srcPath, "pages"),
		Styles:        filepath.Join(srcPath, "sass"),
		ModuleEntries: filepath.Join(srcPath, "module-entries"),
	}

	DistPathMapping = PathMapping{
		Pages:         filepath.Join(distPath, "pages"),
		Styles:        filepath.Join(distPath, "styles"),
		ModuleEntries: filepath.Join(distPath, "module-entries"),
	}
}

func RunAll(mode string) {
	RunStyleCompilation(mode)
}

func RunStyleCompilation(mode string) {
	cmd := exec.Command("npx", "sass", fmt.Sprintf("%s:%s", SrcPathMapping.Styles, DistPathMapping.Styles))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmdErr := cmd.Run()
	if cmdErr != nil {
		// panic(fmt.Sprintf("[%s] failed with error: %v", commandString, cmdErr))
		panic(cmdErr)
	}
	if mode == config.ProductionMode {
		return
	}

	stylesWatcher, createWatcherErr := fsnotify.NewWatcher()
	if createWatcherErr != nil {
		panic(createWatcherErr)
	}
	defer stylesWatcher.Close()

	watchDir := generateWatchDirForWatcher(stylesWatcher)
	if errFileWalk := filepath.Walk(SrcPathMapping.Styles, watchDir); errFileWalk != nil {
		log.Println("Error in file walk of src in RunStyleCompilation:", errFileWalk)
	}

	done := make(chan bool)

	go func() {
		for {
			select {
			case event, _ := <-stylesWatcher.Events:
				{
					filepathFull := event.Name
					filepathAfterSrc := strings.Replace(filepathFull, SrcPathMapping.Styles+"/", "", 1)
					filepathInDist := filepath.Join(DistPathMapping.Styles, filepathAfterSrc)
					log.Printf("In src: %s", filepathFull)
					log.Printf("In dist: %s", filepathInDist)
					log.Printf("Event from RunStyleCompilation: %v", event)
					if event.Op == fsnotify.Remove {
						errRemoving := os.RemoveAll(filepathInDist)
						if errRemoving != nil {
							log.Printf("[RunStyleCompilation] Failed to delete %s\n", filepathInDist)
						} else {
							log.Printf("Deleted %s <-> %s", filepathFull, filepathInDist)
						}
						continue
					}
					cmd := exec.Command("npx", "sass", fmt.Sprintf("%s:%s", filepathFull, filepathInDist))
					cmd.Stdout = os.Stdout
					cmd.Stderr = os.Stderr
					cmdErr := cmd.Run()
					if cmdErr != nil {
						log.Printf("[RunStyleCompilation] failed incremental build: %v\n", cmdErr)
					}
				}
			}
		}
	}()

	<-done

	stylesWatcher.Close()

	return
}

func generateWatchDirForWatcher(watcher *fsnotify.Watcher) func(string, os.FileInfo, error) error {
	return func(path string, fi os.FileInfo, err error) error {
		if fi.Mode().IsDir() {
			return watcher.Add(path)
		}
		return nil
	}
}
