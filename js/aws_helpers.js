var aws_helpers = {

  /**
   *
   *
   */
  buildAWS: function(AWS, region, identity_pool, auth_provider, auth_token) {
    // SETUP AWS
    AWS.config.region = region;

    // Setup Login configuration
    var login_config = {};
    login_config[auth_provider] = auth_token;


    var params = {
      IdentityPoolId: identity_pool,
      Logins: login_config
    };

    AWS.config.credentials = new AWS.CognitoIdentityCredentials(params);
    AWS.config.credentials.expired = true;
    return new Promise(function(fulfill, reject) {
      AWS.config.credentials.get(function(err) {
        if (err) {
          logger.error(err, err.stack);
          reject(err);
        } else {
          logger.info('Success! ' + AWS.config.credentials.identityId);
          fulfill(AWS);
        }
      });
    });
  },
  /**
   *
   *
   */
  getAWSAsync: function(cxt, f, itemType, params) {
    var that = this;
    return new Promise(function(fulfill, reject) {
      f.call(cxt, params, function(err, data) {
        if (err) {
          reject(err);
        }
        else if (data.nextToken) {
          var p = that.getAWSAsyncRecurse(
            cxt,
            f,
            itemType,
            params,
            data.logStreams,
            data.nextToken
          );
          p.done(function(res) {
            fulfill(res);
          });
          p.catch(function(err) {
            logger.error(err, err.stack);
          });
        }
        else {
          fulfill(data[itemType]);
        }
      });
    });
  },

  /**
   *
   *
   */
  getLogStreams: function(cwl, params) {
    logger.info('Starting `getLogStreams`');
    return this.getAWSAsync(cwl, cwl.describeLogStreams, "logStreams", params);
  },

  /**
   *
   *
   */
  filterLogEvents: function(cwl, params) {
    logger.info('Starting `filterLogEvents`');
    return this.getAWSAsync(cwl, cwl.filterLogEvents, "events", params);
  },

  /**
   *
   *
   */
  getLogEvents: function(cwl, params) {
    return this.getAWSAsync(cwl, cwl.getLogEvents, "logEvents", params);
  },

  /**
   *
   *
   */
  getAWSAsyncRecurse: function(cxt, f, itemType, params, agg, nextToken) {
    var that = this;
    params.nextToken = nextToken;
    return new Promise(function(fulfill, reject) {
      f.call(cxt, params, function(err, data) {
        if (agg === undefined) {
          agg = [];
        }
        var acc = agg.concat(data[itemType]);
        if (err) {
          reject(err);
        }
        else if (data.nextToken) {
          var p = that.getAWSAsyncRecurse(cxt, f, itemType, params, acc, data.nextToken);
          p.done(function(res) {
            fulfill(res);
          });
          p.catch(function(err) {
            logger.error(err, err.stack);
          });
        }
        else {
          fulfill(acc);
        }
      });
    });
  },
};
