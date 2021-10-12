import Vue from 'vue'
import Frame, { Message, MessageTypes } from '~/types/message'
import { clear, record, stop } from '~/types/recorder'
import readAudioFromFrame from '~/scripts/readAudioFromFrame'
import rtc from '~/scripts/rtc'

type AlertType = {
  id: number
  snackbar: boolean
  text: string
  timeout: number
}

export default Vue.extend({
  name: 'Channel',

  data: () => ({
    message: '',
    ws: null as WebSocket | null,
    frames: [] as Frame[],
    userId: +Math.random().toString().slice(2),
    name: '',
    alerts: [] as AlertType[],
    voice: false,
    // @ts-ignore
    recorder: null as any,
    data: [] as Blob[],
    callDialog: false,
    devises: {
      audioInput: [] as MediaDeviceInfo[],
      videoInput: [] as MediaDeviceInfo[],
    },
    videoInput: null as null | string,
    peerConnection: null as null | RTCPeerConnection,
    connected: false,
  }),

  computed: {
    users() {
      return this.$store.state.UsersModule.users
    },
    voiceAvailable() {
      return typeof navigator !== 'undefined' && 'mediaDevices' in navigator
    },
  },

  watch: {
    alerts(val: AlertType[]) {
      if (val.some((el) => !el.snackbar))
        this.alerts = this.alerts.filter((el) => el.snackbar)
    },
    frames() {
      if (
        Math.abs(
          document.body.scrollHeight - window.innerHeight - window.scrollY
        ) < 10
      )
        this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))
    },
    voice(val: boolean) {
      if (val !== undefined) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          clear()
          const [recorder, data] = record(stream)
          this.recorder = recorder
          // @ts-ignore
          this.data = data
        })
      } else {
        this.recorder.current.onstop = () => {
          new Response(this.data[0]).arrayBuffer().then((r) => {
            this.ws?.send(
              new Message({
                content: {
                  // @ts-ignore
                  audio: String.fromCharCode.apply(null, new Uint8Array(r)),
                },
                userId: this.userId,
                type: MessageTypes.Message,
              }).toString()
            )
          })
        }
        stop()
      }
    },
    callDialog(val: boolean) {
      if (val) {
        this.$nextTick(() => {
          rtc(this.ws!, (this.$refs.video as HTMLVideoElement[])[0], {
            deviseId: this.videoInput,
            userId: this.userId,
          }).then((peer) => {
            this.peerConnection = peer
            this.peerConnection.ontrack = ({ streams: [stream] }) => {
              console.log(stream)
              ;(this.$refs.video as HTMLVideoElement[])[1].srcObject = stream
            }
          })
        })
      } else (this.$refs.video as HTMLVideoElement[])[0].srcObject = null
    },
    videoInput() {
      // localStorage.setItem('video_input', val)
      // rtc(this.ws!, (this.$refs.video as HTMLVideoElement[])[0], {
      //   deviseId: val,
      //   userId: this.userId,
      // }).then((peer) => (this.peerConnection = peer))
    },
  },

  mounted() {
    this.videoInput = localStorage.getItem('video_input')
    this.name =
      localStorage.getItem('user_name') || prompt('Введите ваше имя:') || ''
    if (!this.name) this.$router.push('/')
    localStorage.setItem('user_name', this.name)

    this.ws = new WebSocket(
      `${process.env.WEBSOCKET_URL}/chat/${this.$route.params.channel}`
    )
    this.ws.onclose = () => {
      this.ws = null
    }
    this.ws.onmessage = (e: MessageEvent) => {
      const frame = Frame.parse(e.data)
      if (frame.type === MessageTypes.Message) {
        if ('content' in frame.body && 'message' in frame.body.content)
          this.frames.push(frame)
        else if ('content' in frame.body && 'audio' in frame.body.content) {
          frame.body.content.audio = readAudioFromFrame(
            frame.body.content.audio as string
          )
          this.frames.push(frame)
        }
      } else if (frame.type === MessageTypes.Offer && 'content' in frame.body) {
        if (frame.body.userId !== this.userId) {
          const content = frame.body.content as any
          console.log('MessageTypes.Offer', frame.body)
          const prepare = async () => {
            await this.peerConnection?.setRemoteDescription(
              new RTCSessionDescription(content as any)
            )
            const answer = await this.peerConnection?.createAnswer()
            await this.peerConnection?.setLocalDescription(
              new RTCSessionDescription(answer)
            )

            this.ws!.send(
              new Message({
                content: { sdp: answer?.sdp, type: answer?.type },
                userId: this.userId,
                type: MessageTypes.Answer,
              }).toString()
            )
          }
          prepare()
        }
      } else if (
        frame.type === MessageTypes.Answer &&
        'content' in frame.body
      ) {
        if (frame.body.userId !== this.userId) {
          const content = frame.body.content as any
          console.log('MessageTypes.Answer', content)
          // this.peerConnection?.setRemoteDescription(
          //   new RTCSessionDescription(content)
          // )
        }
      } else {
        if ('users' in frame.body) {
          this.$store.commit('UsersModule/setUser', frame.body.users)
        }
        const user = this.users.slice(-1)[0]
        if (user && user.id !== this.userId) {
          this.alerts.push({
            id: Math.random(),
            snackbar: true,
            text:
              frame.type === MessageTypes.Join
                ? `К каналу присоединился новый пользователь ${user.name}`
                : 'Пользователь покинул канал',
            timeout: 3000,
          })
        }
      }
    }
    this.ws.onopen = () => {
      this.connected = true
      this.ws!.send(
        new Message({
          content: { name: this.name, id: this.userId },
          userId: this.userId,
          type: MessageTypes.Join,
        }).toString()
      )
    }
    navigator.mediaDevices.enumerateDevices().then((result) => {
      this.devises.audioInput = result.filter((el) => el.kind === 'audioinput')
      this.devises.videoInput = result.filter((el) => el.kind === 'videoinput')
    })
  },

  beforeDestroy() {
    this.ws?.close()
  },

  methods: {
    sendMessage() {
      if (!this.message) return
      this.ws?.send(
        new Message({
          content: { message: this.message.trim() },
          userId: this.userId,
          type: MessageTypes.Message,
        }).toString()
      )
      this.message = ''
      const input = this.$refs.input as HTMLTextAreaElement
      input.focus()
    },
  },
})
