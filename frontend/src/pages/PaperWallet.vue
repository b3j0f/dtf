<template>
  <q-page padding>
    <h5>Gestion des porte-feuille papiers</h5>
    <q-btn label="reset" @click="reset" icon="restore" />
    <q-tabs v-model="tabs" align="justify" glossy>
      <q-tab name="generator" label="Generator" slot="title"/>
      <q-tab name="reader" label="Reader" slot="title"/>
      <q-tab-pane name="generator" default>
        <div class="group row">
          <q-field label="Votre compte" class="col-12" :labelWidth="2">
            <q-tabs v-model="issuer" align="justify">
              <q-tab name="key" label="Clef privée" slot="title" />
              <q-tab name="auth" label="identifiants" slot="title" />
              <q-tab-pane name="key">
                <q-input v-model="generator.privkeyA" float-label="Clef privée" />
              </q-tab-pane>
              <q-tab-pane name="auth">
                <q-input v-model="username" float-label="Identifiant secret" />
                <q-input v-model="password" float-label="Mot de passe" />
              </q-tab-pane>
            </q-tabs>
          </q-field>
          <q-field label="Portefeuille papier" class="col-12" :labelWidth="2">
            <div class="row group">
              <q-input v-model="generator.privkeyB" float-label="Clef privée" class="col-8"/>
              <q-btn label="générer" @click="generate" class="col-3" />
            </div>
            <q-input float-label="Montant" type="number" label="Montant" v-model="generator.amount" />
            <q-field label="Arrière plan" class="col-12" :labelWidth="2">
              <div class="row group justify-around">
                <q-select float-label="Illustration" radio :options="backgrounds" v-model="background" clearable class="col" />
                <q-color v-model="color" clearable float-label="Couleur" class="col" />
              </div>
            </q-field>
            <div ref="paperwallet" class="col-12 row group relative-position" :style="paperwalletStyle">
              <q-field label="Clef publique" class="col-6">
                <qrcode v-if="generator.pubkeyB" :value="generator.pubkeyB" tag="img" class="responsive" />
              </q-field>
              <q-field label="Clef privée" class="col-5">
                <qrcode v-if="generator.privkeyB" :value="generator.privkeyB" tag="img" class="responsive" />
              </q-field>
              <q-inner-loading :visible="!generated" />
            </div>
            <q-btn label="Créer" @click="submit" />
            <q-btn :disable="!generated" label="Imprimer" icon="print" @click="print" />
          </q-field>
        </div>
      </q-tab-pane>
      <q-tab-pane name="reader">
        <div class="group row">
          <q-field label="Votre clef publique">
            <q-input v-model="reader.pubkeyB" />
          </q-field>
          <q-field label="Portefeuille papier">
            <q-btn label="Lire la clef publique" @click="reader.pubkeyB = null" />
            <q-input label="Clef publique" v-model="reader.pubkeyB" />
            <qrcode-reader @decode="decodeP" v-if="reader.pubkeyB === null" />
            <q-btn label="Lire la clef privée" @click="reader.privkeyB = null" />
            <q-input label="Clef privée" v-model="reader.privkeyB" />
            <qrcode-reader @decode="decodeS" v-if="reader.privkeyB === null" />
          </q-field>
          <q-field class="relative-position">
            Montant trouvé : {{ reader.amount }}
            <q-btn label="Réaliser la transaction" @click="submit" />
            <q-inner-loading :visible="loading" />
          </q-field>
        </div>
      </q-tab-pane>
    </q-tabs>
    <q-card>
      <q-card-title>
        Détails
        <q-toggle v-model="details" slot="right" />
      </q-card-title>
      <q-card-main v-if="details">
        <q-field label="Transaction">
          <q-input readonly type="textarea" :value="transaction" />
        </q-field>
        <q-field label="Signature">
          <q-input readonly :value="signature" />
        </q-field>
      </q-card-main>
    </q-card>
  </q-page>
</template>

<script>
import lune from 'assets/lune.jpg'
import adopte from 'assets/adopte.jpg'
import cb from 'assets/cb.jpg'
import logo from 'assets/logo.jpg'
import doliprane from 'assets/doliprane.jpg'
import torture from 'assets/torture.jpg'

const backgrounds = [
  {value: lune, label: 'Lune', default: true},
  {value: adopte, label: 'Adopte'},
  {value: cb, label: 'Carte banquaire'},
  {value: logo, label: 'Logo'},
  {value: doliprane, label: 'Doliprane'},
  {value: torture, label: 'Torture'}
]

export default {
  name: 'PaperWallet',
  data () {
    return {
      backgrounds,
      background: backgrounds[Object.keys(backgrounds)[0]],
      tabs: 'generator',
      issuer: 'auth',
      color: '',
      generator: {
        pubkeyA: '',
        privkeyA: '',
        pubkeyB: '',
        privkeyB: '',
        amount: 0
      },
      reader: {
        pubkeyA: '',
        privkeyA: '',
        pubkeyB: '',
        privkeyB: '',
        amount: 0
      },
      username: '',
      password: '',
      transaction: '',
      signature: '',
      loading: false,
      details: false,
      generated: false
    }
  },
  computed: {
    paperwalletStyle () {
      return {
        background: `center / contain ${this.color} url("${this.background}") repeat-x`
      }
    }
  },
  watch: {
    issuer (val) {
      const secretKey = val === 'key' ? this.$nacl.util.decodeUTF8(this.privkeyA) : this.$nacl.sign.keyPair().secretKey
      switch (val) {
        case 'key':
          this.pubkeyA = this.$nacl.sign.keyPair.fromSecretKey(secretKey)
          break
        case 'auth':

          break
        default:
      }
    }
  },
  methods: {
    reset () {
      this.signature = ''
      this.transaction = ''
      this.username = ''
      this.password = ''
      this.generated = false
      this.generator = {
        pubkeyA: '',
        privkeyA: '',
        pubkeyB: '',
        privkeyB: '',
        amount: 0
      }
      this.reader = {
        pubkeyA: '',
        privkeyA: '',
        pubkeyB: '',
        privkeyB: '',
        amount: 0
      }
    },
    decodeP (value) {
      this.pubkeyA = value
    },
    decodeS (value) {
      this.privkeyA = value
    },
    generate () {
      this.generator.privkeyB = this.$nacl.util.encodeBase64(this.$nacl.sign.keyPair().secretKey)
    },
    getParams () {
      const result = {}
      Object.entries(this[this.tabs]).forEach(
        (name, value) => {
          result[name] = typeof value === 'string' ? this.$nacl.util.decodeUTF8(value) : value
        }
      )
      return result
    },
    print () {
      this.$refs.paperwallet.print()
      this.generated = false
    },
    async submit () {
      const {
        pubkeyA,
        privkeyA,
        pubkeyB,
        amount
      } = this.getParams()
      try {
        this.transaction = await this.$axios.get(`http://b3j0f.org:9000/tx/${pubkeyA}/${pubkeyB}/${amount}`)
        const transaction = this.$nacl.util.decodeUTF8(this.transaction)
        const signature = this.$nacl.sign(transaction, privkeyA)
        this.signature = this.$nacl.util.encodeBase64(signature)
        await this.$axios.post(`http://b3j0f.org:9000/tx/${pubkeyA}`, this.signature)
        this.generated = true
      } catch (err) {
        this.$q.notify({
          type: 'negative',
          message: err.message
        })
      }
    }
  }
}
</script>

<style>
</style>
