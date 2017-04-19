'use strict'
const redis = require('redis')
const RSVP = require('rsvp')

class Redis {
  constructor (options) {
    let redisOptions = {}

    if (options.url) {
      redisOptions = this._stripUsernameFromConfigUrl(options.url)
    } else {
      redisOptions = {
        host: options.host,
        port: options.port
      }

      if (options.password) {
        redisOptions.password = options.password
      }
    }

    this._client = redis.createClient(redisOptions)
  }

  _stripUsernameFromConfigUrl (configUrl) {
    const regex = /redis:\/\/(\w+):(\w+)(.*)/
    const matches = configUrl.match(regex)

    if (matches) {
      configUrl = 'redis://:' + matches[2] + matches[3]
    }

    return configUrl
  }

  publish (channel, value) {
    return new RSVP.Promise((resolve, reject) => {
      this._client.publish(channel, value, (error) => {
        if (error) {
          return reject(error)
        }
        resolve()
      })
    })
  }
}

module.exports = Redis
