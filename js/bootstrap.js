/**
 *
 * Bootstrap script.
 *
 * Avoid puttings things here
 *
 */
var logger = log.noConflict();

logger.setDefaultLevel('debug');
logger.info("Starting Application");
(function(_, AWS, config, utils, aws_helpers, graph) {
  document.addEventListener("DOMContentLoaded", function(event) {
    _.app = new Application(utils, aws_helpers, graph);
    _.onSignIn = function(googleUser) {

      aws_helpers.buildAWS(
          AWS,
          config.aws.region,
          config.aws.identity_pool,
          config.auth.provider,
          googleUser.getAuthResponse().id_token
          ).catch(function(err) {
        console.err(err, err.stack);
      }).then(function(AWS) {
            _.app.setup(AWS).catch(function(err) {
              console.log(_.app);
              console.error(err, err.stack);
            }).then(function() {
              _.app.go(config.start_time);
            });
          })
    };
  });
})(window, AWS, config, utils, aws_helpers, graph);
