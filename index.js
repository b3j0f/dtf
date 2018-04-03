const request = require('request')
const express = require('express')
const app = express()

const query = (res, req) => {
  Object.assign(req.query, defaultQuery)
  const {node, currency} = req.query
  if (typeof node === 'function') {
    req.query.node = node(res, currency)
  }
  return req.query
}

const params = (res, req, names = ['pubkeyA', 'pubkeyB', 'amount']) => {
  const result = {}
  names.forEach(
    name => {
      const value = req.params[name]
      if (value === undefined) {
        return res.status(500).send(`${name} is a required parameter`)
      }
      result[name] = value
    }
  )
  return result
}

const endpointsByCurrency = {
  g1: ['https://g1.imirhil.fr'],
  ['g1-test']: ['https://g1-test.cgeek.fr']
}

const getEndpoint = (res, currency = defaultQuery.currency) => {
  const endpoints = endpointsByCurrency[currency]
  if (endpoints === undefined) {
    return res.status(500).send(`Unknown currency ${currency}`)
  }
  const rand = Math.floor((Math.random() * endpoints.length) + 0)
  const endpoint = endpoints[rand]
  false && request(
    {
      url: `${endpoint}/network/peers`,
      method: 'GET'
    },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        if (endpoints.length === 1) {
          return res.status(500).send(`starting ${endpoint} is not up`)
        }
        return getEndpoint(res, currency)
      }
      const {peers} = JSON.parse(body)
      peers.forEach(
        peer => {
          if (peer.status === 'UP') {
            const pendpoints = peer.endpoints
            pendpoints.forEach(
              pendpoint => {
                const entries = pendpoint.split(' ')
                const eurl = `${entries[1]}:${entries[entries.length - 1]}`
                endpoints.push(eurl)
              }
            )
          }
        }
      )
    }
  )
  return endpoint
}

const defaultQuery = {
  node: getEndpoint,
  version: 3,
  currency: 'g1-test',
  locktime: 0,
  base: 0,
  comment: ''
}

getEndpoint()

const prepareTransaction = ({
  pubkeyA,
  pubkeyB,
  amount,
  inputs,
  block,
  comment,
  version,
  currency,
  locktime,
  base
} = defaultQuery) => {
  return `Version: ${version}\n`+`Type: Transaction\n`+
    `Currency: ${currency}\n`+`Blockstamp: ${block.number}-${block.hash}\n`+
    `Locktime: ${locktime}\n`+`Issuers: \n${pubkeyA}\n`+
    `Inputs: \n${inputs.join('\n')}\n`+`Unlocks: \n0:SIG(0)\n`+
    `Outputs: \n${amount}:${base}:SIG(${pubkeyB})\n`+
    `Comment: ${comment}\n`
}

app.get(
  '/',
  (req, res) => {
    const answer = [{
      description: 'Get a raw transaction document without a signature, from one issuer to one receiver',
      url: '/:pubkeyA/:pubkeyB/:amount',
      method: 'GET',
      params: {
        pubkeyA: {
          description: 'issuer public key'
        },
        pubkeyB: {
          description: 'receiver public key'
        },
        amount: {
          description: 'Amount to transfere'
        }
      },
      query: {
        currency: {
          description: 'Currency to use.',
          type: 'string',
          default: defaultQuery.currency
        },
        node: {
          description: 'Duniter node to use.',
          type: 'string',
          default: `random between existing nodes (example : ${getEndpoint(res)})`
        },
        comment: {
          description: 'Transaction comment',
          type: 'string',
          default: defaultQuery.comment
        },
        version: {
          description: 'Document version to use',
          type: 'integer',
          default: defaultQuery.version
        },
        locktime: {
          description: 'Transaction locktime',
          type: 'integer',
          default: defaultQuery.locktime
        },
        base: {
          description: 'Base transaction',
          type: 'integer',
          default: defaultQuery.base
        }
      },
      example: {
        description: 'The issuer with public key "public_key_issuer" is asking for a transaction document for the receiver "public_key_receiver" with an amount of 500 on the currency "g1-test"',
        url: '/public_key_issuer/public_key_receiver/500?currency=g1-test'
      }
    }, {
      description: 'Post a transaction document on a Duniter instance related to an old transaction document generated with the previous operation, and a dedicated signature. Reject the request if the document is not validated by a peer.',
      url: `/:pubkeyA`,
      method: 'POST',
      params: {
        pubkeyA: {
          description: 'issuer public key'
        }
      },
      query: {
        node: {
          description: 'Duniter node to use.',
          type: 'string',
          default: 'random between existing nodes'
        }
      },
      body: {
        description: 'transaction document signature.'
      }
    }, {
      description: 'Post a new array of currency endpoints. If currency already exist, the request is rejected. Require authentication.',
      url: `/:currency`,
      method: 'POST',
      query: {
        currency: {
          description: 'New currency to use'
        }
      },
      body: {
        description: 'Array of endpoints to use.'
      }
    }, {
      description: 'Update an existing array of currency endpoints. Require authentication.',
      url: `/:currency`,
      method: 'PUT',
      query: {
        currency: {
          description: 'Currency endpoints to update'
        }
      },
      body: {
        description: 'Array of endpoints to use.'
      }
    }, {
      description: 'Delete an existing array of currency endpoints. Require authentication.',
      url: `/:currency`,
      method: 'DELETE',
      query: {
        currency: {
          description: 'Currency endpoints to delete'
        }
      }
    }]
    res.send(answer)
  }
)

const transactionsByPubkey = {}

app.get(
  '/:pubkeyA/:pubkeyB/:amount',
  (req, res) => {
    const {
      pubkeyA,
      pubkeyB,
      amount
    } = params(res, req)
    const {
      node,
      comment,
      version,
      currency,
      locktime,
      base
    } = query(res, req)
    request(
      `${node}/blockchain/current`,
      function (error, response, body) {
        if (error) {
          return res.status(500).send(error.message)
        } else if (response.statusCode !== 200) {
          return res.status(response.statusCode).send(body)
        }
        const block = JSON.parse(body)
        request(
          `${node}/tx/sources/${pubkeyA}`,
          function (error, response, body) {
            if (error) {
              return res.status(500).send(error.message)
            } else if (response.statusCode !== 200) {
              return res.status(response.statusCode).send(body)
            }
            const inputs = []
            let tmpAmount = amount
            const {sources} = JSON.parse(body)
            for (let source of sources) {
              const amountToRetrieve = tmpAmount > source.amount ? source.amount : (source.amount - tmpAmount)
              tmpAmount -= amountToRetrieve
              inputs.push(`${amountToRetrieve}:T:${source.identifier}:${source.noffset}`)
              if (tmpAmount < 0) {
                break
              }
            }
            if (tmpAmount > 0) {
              return res.status(200).send(`Unsufficient found : ${tmpAmount}`)
            }
            const transaction = prepareTransaction({
              pubkeyA,
              pubkeyB,
              amount,
              inputs,
              block,
              comment,
              version,
              currency,
              locktime,
              base
            })
            if (transactionsByPubkey[currency] === undefined) {
              transactionsByPubkey[currency] = {}
            }
            transactionsByPubkey[currency][pubkeyA] = transaction
            // send raw transaction
            res.send(transaction)
          }
        )
      }
    )
  }
)

app.post(
  '/:pubkeyA',
  (req, res) => {
    const {node} = query(res, req)
    const {pubkeyA} = params(res, req, ['pubkeyA'])
    const signature = req.body
    const transactions = transactionsByPubkey[currency]
    if (transactions === undefined) {
      return res.status(500).send(`Unknown currency : ${currency}`)
    }
    const transaction = transactions[pubkeyA]
    if (transaction === undefined) {
      return res.status(500).send(`Unknown pubkey ${pubkeyA}. Generate the transaction document before.`)
    } else {
      delete transactions[pubkeyA]
    }
    request(
      {
        url: `${node}/tx/process`,
        method: 'POST',
        data: `${transaction}${signature}\n`
      },
      (error, response, body) => {
        if (error) {
          return res.status(500).send(error.message)
        } else if (response.statusCode !== 200) {
          return res.status(response.statusCode).send(body)
        }
        res.send(body)
      }
    )
  }
)

app.post(
  '/:currency',
  (req, res) => {
    const {currency} = req.currency
    const endpoints = JSON.parse(req.body)
    if (endpointsByCurrency[currency] !== undefined) {
      return res.status(500).send(`Currency ${currency} already exist`)
    }
    endpointsByCurrency[currency] = endpoints
  }
)


app.put(
  '/:currency',
  (req, res) => {
    const {currency} = req.currency
    const endpoints = JSON.parse(req.body)
    if (endpointsByCurrency[currency] === undefined) {
      return res.status(500).send(`Currency ${currency} does not exist`)
    }
    endpointsByCurrency[currency] = endpoints
  }
)


app.delete(
  '/:currency',
  (req, res) => {
    const {currency} = req.currency
    if (endpointsByCurrency[currency] === undefined) {
      return res.status(500).send(`Currency ${currency} does not exist`)
    }
    delete endpointsByCurrency[currency]
  }
)

app.listen(process.env.PORT || 3000)
