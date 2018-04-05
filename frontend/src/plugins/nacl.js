// import something here
import nacl from 'tweetnacl'
nacl.util = require('tweetnacl-util')

const NACL = {
  install (Vue, options) {
    Vue.prototype.$nacl = nacl
  }
}

// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  Vue.use(NACL)
}
