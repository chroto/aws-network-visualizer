var Application = function Application(utils, aws_helpers, graph) {

  // AWS connection
  this.AWS = null;

  // Attach modules to the Application instance
  this.aws_helpers = aws_helpers;
  this.utils = utils;
  this.graph = graph;
  this.config = config;

  // Network data
  this.network = {};
  this.network.nodes = {};
  this.network.edges = {};
  this.network.subnets = {};
  this.network.az = {};

  this.myGraph = null;

};

/**
 *
 */
Application.prototype.setup = function(AWS) {
  var that = this;
  this.AWS = AWS;
  return new Promise(function(fulfill, reject) {
    that.cloudwatchlogs = new this.AWS.CloudWatchLogs();
    that.ec2 = new AWS.EC2();
    that.myGraph = this.graph.redrawAll([]);

    that.ec2.describeVpcs({
      'VpcIds': [config.vpc]
    }, function(err, data) {
      if (err) {
        logger.error(err, err.stack);
        reject(err);
      }
      else {
        var vpc = data.Vpcs[0];
        config.vpc_cidr = vpc.CidrBlock;
        that.ec2.describeSubnets({
          'Filters': that.config.ec2_subnet_filters
        }, function(err, data) {
          if (err) {
            logger.error(err, err.stack);
            reject(err);
          }
          else {
            that.config.subnets = data.Subnets;

            that.config.subnets.forEach(function(subnet) {
              that.network.subnets[subnet.CidrBlock] = [];
              that.network.az[subnet.CidrBlock] = subnet.AvailabilityZone;
            });
            fulfill(data);
          }
        });
      }
    });
  });
};

/****
 *
 *
 *
 *
 */
Application.prototype.go = function(start_time) {
  var that = this;
  var end_time = start_time + 1000 * this.config.refresh_interval_in_seconds;
  var logStreamsPromise = that.aws_helpers.getLogStreams(that.cloudwatchlogs, {
    "logGroupName": "VPCFlowLogs",
  });
  var allFilterLogPromises = [];

  logger.debug('Start Time: ' + start_time);
  logger.debug('End Time: ' + end_time);

  logStreamsPromise.then(function(logStreams) {
    var logStreamNames = logStreams.map(function(obj) {
      return obj.logStreamName;
    });
    var logStreamNameChunks = that.utils.chunk(logStreamNames, 100);
    while (logStreamNameChunks.length > 0) {
      allFilterLogPromises.push(
        that.aws_helpers.filterLogEvents(that.cloudwatchlogs, {
          logGroupName: "VPCFlowLogs",
          startTime: start_time,
          endTime: end_time,
          filterPattern: that.config.network_filter,
          logStreamNames: logStreamNameChunks.pop()
        }).then(function(eventData) {
          var logEvents = eventData.map(function(obj) {
            var splitUpMessage = obj.message.split(' ');
            return {
              'accountId': splitUpMessage[1],
              'interfaceId': splitUpMessage[2],
              'src': splitUpMessage[3],
              'dst': splitUpMessage[4],
              'srcPort': parseInt(splitUpMessage[5], 10),
              'dstPort': parseInt(splitUpMessage[6], 10),
              'protocol': parseInt(splitUpMessage[7], 10),
              'packets': parseInt(splitUpMessage[8], 10),
              'bytes': parseInt(splitUpMessage[9], 10),
              'start': parseInt(splitUpMessage[10], 10),
              'end': parseInt(splitUpMessage[11], 10),
              'action': splitUpMessage[12],
            };
          });
          that.addToNetwork(logEvents);
        })
      );
    }
    Promise.all(allFilterLogPromises)
      .then(function(blergh) {
        window.setTimeout(function() {
          that.go(end_time);
        }, 1000 * that.config.refresh_interval_in_seconds);
      });
  });
  logStreamsPromise.catch(function(err) {
    logger.error(err);
  });
};

Application.prototype.addToNetwork = function(logEvents) {
  var that = this;

  // Add this back in when selection is figured out

  var allNodes = that.myGraph.body.data.nodes;
  var allEdges = that.myGraph.body.data.edges;
  logEvents.forEach(function(currentValue) {
    var edge = currentValue.src + ' -> ' + currentValue.dst;
    var src = currentValue.src;
    var dst = currentValue.dst;
    var srcParent = 'Unknown';
    var dstParent = 'Unknown';
    var dstPort = currentValue.dstPort;

    if (src in that.network.nodes) {
      that.network.nodes[src].value += 1;
      that.myGraph.body.data.nodes.update({
        id: src,
        label: src,
        value: that.myGraph.body.data.nodes.get(src).value + 1
      });
      logger.debug('Updating Node: ' + src + ' with new value ' + that.network.nodes[src].value);
    } else {
      for (var cidr in that.network.subnets) {
        if (src in that.network.subnets[cidr]) {
          break;
        }
        if (this.utils.isInCidr(src, cidr)) {
          that.network.subnets[cidr][src] = undefined;
          srcParent = that.network.az[cidr];
          break;
        }
      }
      that.network.nodes[src] = {
        'id': src,
        'shape': (currentValue.srcPort === 5432 ? 'database' : 'dot'),
        'label': src,
        value: 1,
        group: srcParent
      };
      that.myGraph.body.data.nodes.add({
        id: src,
        shape: (currentValue.srcPort === 5432 ? 'database' : 'dot'),
        label: src,
        value: 1,
        group: srcParent
      });
      logger.debug('Adding new Node: ' + src);
    }
    if (dst in that.network.nodes) {
      that.network.nodes[dst].value += 1;
      that.myGraph.body.data.nodes.update({
        id: dst,
        label: dst,
        value: that.myGraph.body.data.nodes.get(dst).value + 1
      });
      logger.debug('Updating Node: ' + dst + ' with new value ' + that.network.nodes[dst].value);
    } else {
      for (var cidr in that.network.subnets) {
        if (dst in that.network.subnets[cidr]) {
          break;
        }
        if (this.utils.isInCidr(dst, cidr)) {
          that.network.subnets[cidr][dst] = undefined;
          dstParent = that.network.az[cidr];
          break;
        }
      }
      that.network.nodes[dst] = {
        'id': dst,
        'shape': (currentValue.dstPort === 5432 ? 'database' : 'dot'),
        'label': dst,
        value: 1,
        group: dstParent
      };
      that.myGraph.body.data.nodes.add({
        id: dst,
        shape: (currentValue.dstPort === 5432 ? 'database' : 'dot'),
        label: dst,
        value: 1,
        group: dstParent
      });
      logger.debug('Adding new Node: ' + dst);
    }
    if ( edge in that.network.edges ) {
      //network.edges[edge] += 1;
      //do something
    } else {
      that.myGraph.body.data.edges.add({
        from: src,
        to: dst,
        hiddenLabel: that.utils.protocolTranslation(currentValue.protocol) + ':' +  dstPort,
        arrows: 'to'
      });
      that.network.edges[edge] = {
        'from': src,
        'to': dst,
        hiddenLabel: that.utils.protocolTranslation(currentValue.protocol) + ':' +  dstPort,
        'arrows': 'to'
      };
      logger.debug('Adding new Edge: ' + src + ' -> ' + dst);
    }
  });
  that.graph.refresh(that.myGraph);
};

/**
 *
 *
 *
 */
Application.prototype.graphNetwork = function(logEvents) {

  var that = this;
  // Add this back in when selection is figured out
  logEvents.forEach(function(currentValue) {
    var edge = currentValue.src + ' -> ' + currentValue.dst;
    var src = currentValue.src;
    var dst = currentValue.dst;
    var srcParent = 'Unknown';
    var dstParent = 'Unknown';
    var dstPort = currentValue.dstPort;

    if (src in that.network.nodes) {
      that.network.nodes[src].value += 1;
    } else {
      for (var cidr in that.network.subnets) {
        if (src in that.network.subnets[cidr]) {
          break;
        }
        if (this.utils.isInCidr(src, cidr)) {
          that.network.subnets[cidr][src] = undefined;
          srcParent = that.network.az[cidr];
          break;
        }
      }
      that.network.nodes[src] = {'id': src,
        'shape': (currentValue.srcPort === 5432 ? 'database' : 'dot'),
        'label': src, value: 1, group: srcParent};
    }
    if (dst in that.network.nodes) {
      that.network.nodes[dst].value += 1;
    } else {
      for (var cidr in that.network.subnets) {
        if (dst in that.network.subnets[cidr]) {
          break;
        }
        if (this.utils.isInCidr(dst, cidr)) {
          that.network.subnets[cidr][dst] = undefined;
          dstParent = that.network.az[cidr];
          break;
        }
      }
      that.network.nodes[dst] = {
        'id': dst,
        'shape': (currentValue.dstPort === 5432 ? 'database' : 'dot'),
        'label': dst,
        value: 1,
        group: dstParent
      };
    }
    if ( edge in that.network.edges ) {
      //network.edges[edge] += 1;
      //do something
    } else {
      that.network.edges[edge] = {
        'from': src,
        'to': dst,
        'hiddenLabel': this.utils.protocolTranslation(currentValue.protocol) + ':' +  dstPort,
        'arrows': 'to'
      };
    }
  });
  that.myGraph = that.graph.redrawAll(
    Object.keys(that.network.nodes).map(function(k) {
    return that.network.nodes[k];
  }),
  Object.keys(that.network.edges).map(function(k) {
    return that.network.edges[k];
  })
  );
  //for (var cidr in that.network.subnets) {
  //  graph.cluster({
  //    joinCondition: function(opts) {
  //      return opts.group == cidr;
  //    },
  //    clusterNodeProperties: {id: 'cluster:' + cidr, borderWidth: 3,label: cidr}
  //  });
  //}
};
