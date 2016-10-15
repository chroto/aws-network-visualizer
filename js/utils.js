/**
 * Utils Module
 * ------------
 *  A set of utility functions to help development.
 */
var utils = {
  /**
   *
   *
   */
  chunk: function(arr, chunk_size) {
    result = [];
    while (arr.length > 0)
      result.push(arr.splice(0, chunk_size));
    return result;
  },
  /**
   * Determines a protocal identifier from the IANA Protocol Number Spec.
   *
   * <http://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml>
   */
  protocolTranslation: function(iana_protocol_number) {
    switch(iana_protocol_number) {
      case 1:
        return 'ICMP';
      case 6:
        return 'TCP';
      case 17:
        return 'UDP';
      default:
        return 'unknown';
    }
  },


  /**
   *
   *
   */
  isInCidr: function(ipToTest, cidr) {
    var IPNumber = function(IPAddress) {
      var ip = IPAddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if(ip) {
        return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
      }
      throw IPNumber + " is not a valid IP address";
    };
    var IPMask = function(maskSize) {
      return -1<<(32-maskSize)
    };
    return (IPNumber(ipToTest) & IPMask(cidr.split('/')[1])) == IPNumber(cidr.split('/')[0])
  }

};
