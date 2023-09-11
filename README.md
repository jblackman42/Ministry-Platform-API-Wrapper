# MinistryPlatformAPI Node Package

A robust and handy API Client for MinistryPlatformAPI.

## Installation

To use this package in your project:

```bash
npm i ministry-platform-api-wrapper
```

## Setup

Before utilizing the API client, it's essential to set up the required environment variables in a `.env` file. These variables act as configuration parameters for your API client, ensuring proper and secure functioning.

### Environment Variables:

Create a `.env` file in your root directory and define the following variables:

```
OAuthClientID=yourClientID
OAuthClientSecret=yourClientSecret
OAuthBaseAddress=yourOAuthBaseAddress
ServiceAddress=yourServiceAddress
```

Descriptions:

- `OAuthClientID`: Your API Client's ID. More information about API Clients can be found [here](https://kb.ministryplatform.com/kb/develop/oauth-2-0).
- `OAuthClientSecret`: Your API Client's Secret. Keep this confidential.
- `OAuthBaseAddress`: Your OAuth discovery URL. More about your discovery URL [here](https://kb.ministryplatform.com/kb/develop/oauth-2-0).
- `ServiceAddress`: Your platform API URL. More on your platform API URL [here](https://kb.ministryplatform.com/kb/develop/rest-api).

Make sure you've also installed the `dotenv` package:

```bash
npm install dotenv --save
```

Then, at the beginning of your main app file (e.g., `app.js`), insert:

```javascript
require('dotenv').config();
```

## Usage

Here are some examples to get you started:

### Creating a Web API Client

```javascript
const MinistryPlatformAPI = require('ministry-platform-api-wrapper');

const apiClient = await MinistryPlatformAPI.CreateWebApiClient();
console.log("Web API Client created successfully");
```

### Getting Domain Data

```javascript
const domain = await apiClient.request('get', '/domain', null, null);
console.log(domain);
```

### Retrieving a User

```javascript
const user = await apiClient.request('get', '/tables/dp_Users/1', {$select: "Display_Name"}, null);
console.log(user);
```

### Fetching Groups

```javascript
const groups = await apiClient.request('post', '/procs/api_MPP_GetMyGroups', null, {"@ContactID": 1});
console.log(groups);
```

### Updating Contact Information

```javascript
const contact = await apiClient.request('put', '/tables/Contacts', null, [{"Contact_ID": 1, "Nickname": "Jon"}]);
console.log(contact);
```

## Documentation & Further Information

Dive deeper into the API and its functionalities by visiting the comprehensive documentation provided by MinistryPlatformAPI:

[API Documentation](https://{your platform domain}/ministryplatformapi/swagger/ui/index)

Replace `{your platform domain}` with your actual platform domain.

## Feedback

If you have any issues or feedback on improving this package, please raise an issue or contribute to the repository.
