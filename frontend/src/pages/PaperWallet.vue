<template>
  <q-page padding>
    <q-tabs v-model="tabs" align="justify">
      <q-tab name="generator" label="Generator" slot="title"/>
      <q-tab name="reader" label="Reader" slot="title"/>
      <q-tab-pane name="generator" default>
        <div class="group row">
          <q-field label="Vos clefs">
            <q-input v-model="pubkeyA" label="public" />
            <q-input v-model="privkeyA" label="privée" />
          </q-field>
          <q-field label="Portefeuille papier">
            <q-input v-model="pubkeyB" label="Clef publique" />
            <q-input v-model="privkeyB" label="Clef privée" />
            <q-input type="number" label="Montant" v-model="amount" />
          </q-field>
          <q-field>
            <q-btn label="Generate" @click="submit" />
            <q-inner-loading :visible="loading" />
          </q-field>
          <qrcode :val="pubkeyB" tag="img" class="responsive" />
          <qrcode :val="privkeyB" tag="img" class="responsive" />
        </div>
      </q-tab-pane>
      <q-tab-pane name="reader">
        <div class="group row">
          <q-field label="Votre clef publique">
            <q-input v-model="pubkeyB" />
          </q-field>
          <q-field label="Portefeuille papier">
            <q-btn label="Lire la clef publique" @click="pubkeyB = null" />
            <q-input label="Clef publique" v-model="pubkeyB" />
            <qrcode-reader @decode="decodeP" v-if="pubkeyB === null" />
            <q-btn label="Lire la clef privée" @click="privkeyB = null" />
            <q-input label="Clef privée" v-model="privkeyB" />
            <qrcode-reader @decode="decodeS" v-if="privkeyB === null" />
          </q-field>
          <q-field class="relative-position">
            Montant trouvé : {{ amount }}
            <q-btn label="Réaliser la transaction" @click="submit" />
            <q-inner-loading :visible="loading" />
          </q-field>
        </div>
      </q-tab-pane>
    </q-tabs>
  </q-page>
</template>

<script>
export default {
  name: 'PaperWallet',
  data () {
    return {
      tabs: 'generate',
      issuer: '',
      receiver: '',
      pubkeyA: '',
      privkeyA: '',
      pubkeyB: '',
      privkeyB: '',
      amount: 0,
      loading: false
    }
  },
  methods: {
    decodeP (value) {
      this.pubkeyA = value
    },
    decodeS (value) {
      this.privkeyA = value
    },
    generateKeys () {
      const keyA = this.$nacl.box.keyPair()
      this.pubkeyA = keyA.publicKey
      this.privkeyA = keyA.secretKey
      const keyB = this.$nacl.box.keyPair()
      this.pubkeyB = keyB.publicKey
      this.privkeyB = keyB.secretKey
    },
    async submit () {
      try {
        const message = await this.$axios.get(`http://b3j0f.org:3000/${this.pubkeyA}/${this.pubkeyB}/${this.amount}`)
        const signature = this.$nacl.sign(message, this.privkeyA)
        await this.$axios.post(`http://b3j0f.org:3000/${this.pubkeyA}`, signature)
      } catch (err) {
        console.log(err)
      }
    }
  }
}
</script>

<style>
</style>
