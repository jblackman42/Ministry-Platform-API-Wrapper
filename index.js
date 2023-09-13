const axios = require('axios');
const qs = require('qs');

class APIError extends Error {
  constructor(message, data = null) {
    super(message);
    this.data = data; // This could be the raw error data from the API for debugging purposes.
  }
}

const MinistryPlatformAPI = {
  stringToBase64 (input) {
    const encoder = new TextEncoder();
    const byteArray = encoder.encode(input);

    let base64 = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (let i = 0; i < byteArray.length; i += 3) {
        const byte1 = byteArray[i];
        const byte2 = byteArray[i + 1] || 0; // Use 0 if byte is undefined
        const byte3 = byteArray[i + 2] || 0; // Use 0 if byte is undefined

        const index1 = byte1 >> 2;
        const index2 = ((byte1 & 3) << 4) | (byte2 >> 4);
        const index3 = ((byte2 & 15) << 2) | (byte3 >> 6);
        const index4 = byte3 & 63;

        base64 += characters[index1] + characters[index2];
        base64 += (i + 1 < byteArray.length) ? characters[index3] : '=';
        base64 += (i + 2 < byteArray.length) ? characters[index4] : '=';
    }

    return base64;
  },
  async getAuthentication () {
    const tokenData = await axios({
      method: 'post',
      url: this.token_endpoint,
      headers: { 
        'Authorization': this.basic_auth, 
        // 'Authorization': `Basic ${this.stringToBase64(`${this.OAuthClientID}:${this.OAuthClientSecret}`)}`, 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data : qs.stringify({
        'grant_type': this.grant_type,
        'scope': this.scope
      })
    })
      .then(response => response.data)
      .catch((error) => {
        console.log(this.basic_auth)
        error.response.data.status = error.response.status;
        throw new APIError("Failed to authenticate your client. Try checking your OAuthClientID and your OAuthClientSecret. More information about API Clients can be found here: https://kb.ministryplatform.com/kb/develop/oauth-2-0", error.response.data);
      });
    return `${tokenData.token_type} ${tokenData.access_token}`
  },
  async CreateWebApiClient (grant_type = 'client_credentials', scope = 'http://www.thinkministry.com/dataplatform/scopes/all') {
    // get connection variables from environment variables
    // throw error if required vars are missing
    const { OAuthClientID, OAuthClientSecret, OAuthBaseAddress, ServiceAddress } = process.env;
    if (!OAuthClientID) throw new APIError("Missing Required Environment Variable: OAuthClientID", {msg: "Make sure to include 'OAuthClientID' in your environment variables. This value should be your Client_ID for the API Client you want to use. This table can be found under Administration called 'API Clients'."});
    if (!OAuthClientSecret) throw new APIError("Missing Required Environment Variable: OAuthClientSecret", {msg: "Make sure to include 'OAuthClientSecret' in your environment variables. This value should be your Client_Secret for the API Client you want to use. This table can be found under Administration called 'API Clients'."});
    if (!OAuthBaseAddress) throw new APIError("Missing Required Environment Variable: OAuthBaseAddress", {msg: "Make sure to include 'OAuthBaseAddress' in your environment variables. This value should be your discovery URL. More information on your discovery URL can be found here: https://kb.ministryplatform.com/kb/develop/oauth-2-0"});
    if (!ServiceAddress) throw new APIError("Missing Required Environment Variable: ServiceAddress", {msg: "Make sure to include 'ServiceAddress' in your environment variables. This value should be your platform api url. More information on your platform api url can be found here: https://kb.ministryplatform.com/kb/develop/rest-api"});

    
    // checks if sub array is subset of master array
    const isSubset = (master, sub) => !sub.some((string) => master.indexOf(string) == -1);

    // use oauth discovery url to get important information about server & authentication
    // allows for this program to 'learn' new things
    const OAuthDiscovery = await axios({
      method: 'get',
      url: OAuthBaseAddress
    })
      .then(response => response.data)
      .catch(error => {
        error.response.data.status = error.response.status;
        throw new APIError("Failed to retrieve data from OAuthBaseAddress. This value should be your discover URL. More information on your discovery URL can be found here: https://kb.ministryplatform.com/kb/develop/oauth-2-0", error.response.data);
      });

    this.service_address = ServiceAddress;
    this.token_endpoint = OAuthDiscovery.token_endpoint;
    this.basic_auth = `Basic ${this.stringToBase64(`${OAuthClientID}:${OAuthClientSecret}`)}`;
    this.grant_type = grant_type;
    this.scope = scope;

    // check scope and grant type before authentication
    if (!isSubset(OAuthDiscovery.scopes_supported, scope.split(' '))) {
      throw new APIError("Invalid scope detected", {msg: `The scope '${scope}' is not valid. Here is the list of valid scopes: ${OAuthDiscovery.scopes_supported.join(', ')}`});
    }
    if (!isSubset(OAuthDiscovery.grant_types_supported, [grant_type])) {
      throw new APIError("Invalid grant type detected", {msg: `The grant type '${grant_type}' is not valid. Here is the list of valid grant types: ${OAuthDiscovery.grant_types_supported.join(', ')}`});
    }

    // test access token by requesting domain data
    this.domain = await axios({
      method: 'get',
      url: `${ServiceAddress}/domain`,
      headers: { 
        'Authorization': await this.getAuthentication(), 
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.data)
      .catch((error) => {
        error.response.data.status = error.response.status;
        throw new APIError("Failed to retrieve domain data from authenticated user. Make sure the Client User on your API Client has security roles. More information about API Client Permissions can be found here: https://kb.ministryplatform.com/kb/develop/giving-developers-access", error.response.data);
      });
  },
  async request (method, path, query, body) {
    return await axios({
      method: method,
      url: this.service_address + path,
      headers: {
        'Authorization': await this.getAuthentication(), 
        'Content-Type': 'application/json'
      },
      params: query,
      data: body
    })
      .then(response => response.data)
      .catch((error) => new APIError("Failed to make request", error.response.data));
  }
}

module.exports = MinistryPlatformAPI;