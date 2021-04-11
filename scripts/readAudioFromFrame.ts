export default (data: string) => {
  const buf = new ArrayBuffer(data.length * 2) // 2 bytes for each char
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = data.length; i < strLen; i++) {
    bufView[i] = data.charCodeAt(i)
  }
  const blob = new Blob([buf], {
    type: 'audio/webm;codecs=opus',
  })
  return URL.createObjectURL(blob)
}
