<template>
  <div class="channelPage">
    <v-container class="channelPage__container">
      <v-row>
        <v-col>
          <v-row
            v-for="m in frames"
            :key="m.body.id"
            class="mt-2"
            :justify="m.body.user.id === userId ? 'end' : 'start'"
          >
            <v-col cols="8">
              <v-alert
                class="channelPage__message"
                :class="m.body.user.id !== userId && 'pb-1'"
                :border="m.body.user.id === userId ? 'right' : 'left'"
                :color="m.body.user.id === userId ? 'indigo' : 'blue'"
                dark
                style="width: fit-content"
                :style="{ marginLeft: m.body.user.id === userId && `auto` }"
                ><template v-if="'message' in m.body.content">{{
                  m.body.content.message
                }}</template>
                <audio
                  v-else-if="'audio' in m.body.content"
                  :src="m.body.content.audio"
                  controls
                  class="d-block"
                  style="outline: none"
                /><template v-if="m.body.user.id !== userId"
                  ><v-divider class="mt-3"></v-divider
                  ><span class="caption"
                    >From: {{ m.body.user.name }}</span
                  ></template
                ></v-alert
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
              ref="input"
              v-model="message"
              rows="5"
              no-resize
              @keydown.ctrl.enter="sendMessage"
            />
            <div>
              <div v-if="!voice && message">
                <v-btn :disabled="!message" type="submit" icon large>
                  <v-icon> mdi-send </v-icon>
                </v-btn>
              </div>
              <v-btn-toggle v-if="!message" v-model="voice" group rounded dense>
                <v-btn
                  icon
                  class="mt-2 channelPage__voice"
                  large
                  :disabled="!voiceAvailable"
                >
                  <v-icon> mdi-microphone </v-icon>
                </v-btn>
              </v-btn-toggle>
            </div>
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

<script lang="ts" src="./channel.ts" />

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

  & &__voice {
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 0;
  }
}
</style>
