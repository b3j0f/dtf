// import something here
import QRCode from 'vue-qrcode'
import QRCodeReader from 'vue-qrcode-reader'

// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  console.log(QRCode)
  Vue.component('qrcode', QRCode)
  Vue.use(QRCodeReader)
}
