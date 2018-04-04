<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          Quasar App
          <div slot="subtitle">Running on Quasar v{{ $q.version }}</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list-header>Essential Links</q-list-header>
        <q-item to="/paperwallet">
          <q-item-side icon="account_balance_wallet" />
          <q-item-main label="Paper wallet" sublabel="imprimez et lisez des paper wallets" />
        </q-item>
        <q-item to="/chipcard">
          <q-item-side icon="credit_card" />
          <q-item-main label="Chip card" sublabel="Créez et lisez des cartes à puce" />
        </q-item>
        <q-item to="/sms">
          <q-item-side icon="sms" />
          <q-item-main label="SMS" sublabel="Envoyez et recevez des SMS" />
        </q-item>
        <q-item to="/nfc">
          <q-item-side icon="nfc" />
          <q-item-main label="NFC" sublabel="Créez et lisez par le NFC" />
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'LayoutDefault',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop
    }
  },
  methods: {
    openURL
  }
}
</script>

<style>
</style>
