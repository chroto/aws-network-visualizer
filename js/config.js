var config = {
  'aws': {
    region: 'us-east-1',
    identity_pool: '<AWS_IDENTITY_POOL>'
  },

  'auth': {
    'provider': 'accounts.google.com'
  },

  refresh_interval_in_seconds: 120,

  start_time: Date.now() - 1000 * 60 * 15,

  'network_filter': '[version, account, eni, source = 172.16.*, destination = 172.16.*, srcport, destport = 5432 && destport <  32768  && destport != 8500 && destport != 8301, protocol != 1, packets, bytes, windowstart, windowend, action, flowlogstatus]', 
  'vpc': '<VPC-ID>',
  'show_only_vpc': true,
  'ec2_subnet_filters': [{
    Name: 'vpc-id',
    Values: [
      '<VPC-ID>'
    ]
  }]
};
