const recorder = {}
let data = []

export const record = (stream) => {
  recorder.current = new MediaRecorder(stream)
  recorder.current.ondataavailable = (event) => {
    if (event.data.size > 0) {
      data.push(event.data)
    }
  }
  recorder.current.start()

  return [recorder, data]
}

export const stop = () => recorder.current.stop()

export const clear = () => {
  data = []
}
