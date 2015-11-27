(function() {

  var harp = require("harp")
  var path = require("path")
  var fs = require("fs")
  var remote = require("remote")
  var shell = remote.require("shell")
  var enableDestroy = require("server-destroy")
  var dialog = remote.require("dialog")
  var waves = require("../scripts/waves.js")
  var gui = require("../scripts/gui.js")

  var foldericon = document.getElementById("holder")

  var wave = waves.createWave()

  var server

  /*
    Starts a new Harp server for the given app path.
  */
  function startAppServer(file) {
    // Set app path
    var appPath = path.resolve(process.cwd(), file || "")

    // GUI response
    gui.changeFolder()

    // Handle the server if it already exists
    var port = 0
    if (server !== undefined) {
      port = server.address().port
      server.destroy()
    }

    // Start server
    harp.server(appPath, {
        ip: '0.0.0.0',
        port: port
      }, function() {
        server = this
        server.appPath = appPath
        enableDestroy(server)
        gui.serverStarted(server)
        waves.startWave(wave)
      })
  }

  /*
    Detects if a mouse event happens only for the window itself
    and not any of its child elements.
  */
  function onlyWindow(e) {
    if (e.path[e.path.length - 1] == window)
      return true
    return false
  }

  foldericon.onclick = function(e) {
    dialog.showOpenDialog({
      title: 'Choose an app folder',
      properties: [ 'openDirectory' ]
    }, function(filepaths) {
      if (typeof filepaths == 'undefined') return
      var file = filepaths[0]
      startAppServer(file)
    })
  }

  document.ondragover = function(e) {
    waves.stopWave(wave)
    return false
  }

  document.ondragleave = function(e) {
    if (e.clientX == 0 || e.clientY == 0) // The mouse has left the window
      if (server) waves.startWave(wave)
    return false
  }

  document.ondrop = function(e) {
    e.preventDefault()
    var file = e.dataTransfer.files[0].path
    if(!fs.lstatSync(file).isDirectory()) {
      gui.openAlert("That won't work", "You dropped a file, but you must drop an app folder.")
      return false
    }
    startAppServer(file)
    return false
  }

  document.getElementById('build-app').onclick = function(e) {
    gui.startCompileLoading()
    var outPath = path.resolve(server.appPath, '_build')
    harp.compile(server.appPath, outPath, function() {
      shell.openItem(outPath)
      gui.stopCompileLoading()
    })
  }

  document.getElementById('alert-message').onclick = function(e) {
    gui.closeAlert()
  }

}())
