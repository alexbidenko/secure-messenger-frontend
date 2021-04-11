<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card>
        <v-form @submit.prevent="joinChannel">
          <v-card-text>
            <v-text-field
              v-model="channel"
              placeholder="Введите ключ комнаты"
              :rules="[channelRule]"
              class="mb-2"
            />
            <v-btn :disabled="!validation" type="submit">Зайти в комнату</v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" src="./main.ts" />
