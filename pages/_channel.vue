<template>
  <div class="channelPage">
    <v-container class="channelPage__container">
      <v-row>
        <v-col>
          <v-row
            v-for="m in frames"
            :key="m.body.id"
            class="mt-2"
            :justify="m.body.userId === userId ? 'end' : 'start'"
          >
            <v-col cols="8">
              <v-alert
                class="channelPage__message"
                :border="m.body.userId === userId ? 'right' : 'left'"
                :color="m.body.userId === userId ? 'indigo' : 'blue'"
                dark
                >{{ m.body.content }}</v-alert
              >
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <v-card class="channelPage__input" tile width="100%">
      <v-card-text>
        <v-form @submit.prevent="sendMessage">
          <v-layout>
            <v-textarea
              v-model="message"
              rows="5"
              no-resize
              @keydown.ctrl.enter="sendMessage"
            />
            <v-btn :disabled="!message" type="submit" icon>
              <v-icon> mdi-send </v-icon>
            </v-btn>
          </v-layout>
        </v-form>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-for="alert in alerts"
      :key="alert.id"
      v-model="alert.snackbar"
      :timeout="alert.timeout"
      shaped
      color="deep-purple accent-4"
      >{{ alert.text }}</v-snackbar
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Frame, { Message, MessageTypes } from '~/types/message'

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
    userId: Math.random(),
    alerts: [] as AlertType[],
  }),

  watch: {
    alerts(val) {
      if (val.some((el) => !el.snackbar))
        this.alerts = this.alerts.filter((el) => el.snackbar)
    },
    frames() {
      if (window.scrollY === document.body.scrollHeight - window.innerHeight)
        this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))
    },
  },

  mounted() {
    this.ws = new WebSocket(
      `wss://api-admes.admire.social/chat/${this.$route.params.channel}`
    )
    this.ws.onclose = () => {
      this.ws = null
    }
    this.ws.onmessage = (e: MessageEvent) => {
      const frame = Frame.parse(e.data)
      if (frame.type === MessageTypes.Message) this.frames.push(frame)
      else
        this.alerts.push({
          id: Math.random(),
          snackbar: true,
          text:
            frame.type === MessageTypes.Join
              ? 'К каналу присоединился новый пользователь'
              : 'Пользователь покинул канал',
          timeout: 3000,
        })
    }
  },

  beforeDestroy() {
    this.ws?.close()
  },

  methods: {
    sendMessage() {
      if (!this.message) return
      this.ws?.send(
        new Message({ content: this.message.trim(), userId: this.userId })
      )
      this.message = ''
    },
  },
})
</script>

<style lang="scss" scoped>
.channelPage {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__container {
    flex: 1;
  }

  &__message {
    white-space: pre-wrap;
  }

  &__input {
    position: sticky;
    bottom: 36px;
  }
}
</style>
