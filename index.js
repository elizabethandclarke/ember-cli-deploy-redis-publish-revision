/* jshint node: true */
'use strict'
const DeployPluginBase = require('ember-cli-deploy-plugin')
const Redis = require('./lib/redis')

module.exports = {
  name: 'ember-cli-deploy-redis-publish-revision',
  createDeployPlugin: function (options) {
    const DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      runAfter: 'redis',
      defaultConfig: {
        host: 'localhost',
        port: function (context) {
          if (context.tunnel && context.tunnel.srcPort) {
            return context.tunnel.srcPort
          } else {
            return 6379
          }
        },
        redisDeployClient: function (context, pluginHelper) {
          const options = {
            url: pluginHelper.readConfig('url'),
            host: pluginHelper.readConfig('host'),
            port: pluginHelper.readConfig('port'),
            password: pluginHelper.readConfig('password'),
            database: pluginHelper.readConfig('database'),
            maxRecentUploads: pluginHelper.readConfig('maxRecentUploads'),
            allowOverwrite: pluginHelper.readConfig('allowOverwrite'),
            activationSuffix: pluginHelper.readConfig('activationSuffix')
          }

          return new Redis(options)
        },
        revisionKey: function (context) {
          return context.commandOptions.revision || (context.revisionData && context.revisionData.revisionKey)
        },
        keyPrefix: function (context) {
          return context.project.name() + ':index'
        },
        activationSuffix: 'current'
      },
      configure: function (/* context */) {
        this.log('validating config', { verbose: true })

        if (!this.pluginConfig.url) {
          ['host', 'port'].forEach((key) => this.applyDefaultConfigProperty(key))
        }

        ['keyPrefix', 'activationSuffix', 'revisionKey', 'redisDeployClient']
          .forEach((config) => this.applyDefaultConfigProperty(config))

        this.log('config ok', { verbose: true })
      },
      didActivate: function (context) {
        const redisDeployClient = this.readConfig('redisDeployClient')
        const revisionKey = this.readConfig('revisionKey')
        const prefix = this.readConfig('keyPrefix') // ec:index
        const activationSuffix = this.readConfig('activationSuffix') // current

        const channel = `${prefix}:${activationSuffix}:changed`

        return redisDeployClient.publish(channel, revisionKey)
          .then(() => {
            this.log(`succesfully published to channel=${channel} revisionKey=${revisionKey}`)
          })
      }
    })
    return new DeployPlugin()
  }
}
