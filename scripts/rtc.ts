import { Message, MessageTypes } from '~/types/message'

export default async (
  ws: WebSocket,
  ref: HTMLVideoElement,
  options: { deviseId: null | string; userId: number }
) => {
  const peerConnection = new RTCPeerConnection()
  // @ts-ignore
  window.peerConnection = peerConnection

  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer))

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: options.deviseId || undefined },
    audio: { echoCancellation: true, noiseSuppression: true },
  })
  ref.srcObject = stream
  ref.muted = true
  ref.play()
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream))

  console.log('send')
  ws.send(
    new Message({
      content: { sdp: offer.sdp, type: offer.type },
      userId: options.userId,
      type: MessageTypes.Offer,
    }).toString()
  )

  return peerConnection
}
