const request = require('request')
const express = require('express')
const app = express()

const defaultNode = 'https://g1.imirhil.fr/'

const prepareTransaction = (
  {
    pubkeyA,
    pubkeyB,
    amount,
    inputs,
    block,
    comment = '',
    version = 3,
    currency = 'g1',
    locktime = 0,
    base = 0
  }) => {
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
    const {
      pubkeyA,
      pubkeyB,
      amount,
      node = defaultNode,
      comment = '',
      version = 3,
      currency = 'g1',
      locktime = 0,
      base = 0
    } = req.query
    request(
      `${node}blockchain/current`,
      function (error, response, body) {
        const block = JSON.parse(body)
        request(
          `${node}tx/sources/${pubkeyA}`,
          function (error, response, body) {
            const inputs = []
            let tmpAmount = amount
            const sources = JSON.parse(body).sources
            for (let source of sources) {
              const amountToRetrieve = tmpAmount > source.amount ? source.amount : (source.amount - tmpAmount)
              tmpAmount -= amountToRetrieve
              inputs.push(`${amountToRetrieve}:T:${source.identifier}:${source.noffset}`)
              if (tmpAmount < 0) {
                break
              }
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
            console.log(transaction)
            res.send(transaction)
          }
        )
      }
    )
  }
)

app.post(
  '/',
  (req, res) => {
    const {node = defaultNode} = req.query
    const block = req.body
    request(
      {
        url: `${node}tx/process`,
        method: 'POST',
        data: {
          block
        }
      },
      (error, response, body) => {
        res.send(body)
      }
    )
  }
)

app.listen(3000)
