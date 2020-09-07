# [simplisafe](https://www.npmjs.com/package/simplisafe)

[![GitHub CI status](https://github.com/ryanblock/simplisafe/workflows/Node%20CI/badge.svg)](https://github.com/ryanblock/simplisafe/actions?query=workflow%3A%22Node+CI%22)

A simple module for arming, disarming, and getting the status and systems of recent (2018+) [Simplisafe alarm systems](https://simplisafe.com/).

---

## Setup

You'll need:

- A set up & configured Simplisafe alarm (2018+, also known as "All new Simplisafe")
- The email and password to the Simplisafe account you'll be using with this client

```sh
npm i simplisafe
```

Require `simplisafe` in your project:
```javascript
let simplisafe = require('simplisafe')
```

---

## Configuration

`simplisafe` must be used with configuration set via either environment variables, or passed as parameters. (If both are supplied, the environment variable will win.)


### Environment variables

The following configuration environment variables are **required** if not passing a `config` **object**:

- `SIMPLISAFE_EMAIL` - **string** - the email associated with your Simplisafe account
- `SIMPLISAFE_PASSWORD` - **string** - your Simplisafe password
- `SIMPLISAFE_SESSION_ID` - **string** - validated session ID (see [authorization](#authorization) below)

To work with `simplisafe` locally, I suggest setting up your variables with [dotenv](https://www.npmjs.com/package/dotenv).


### Config object

The following configuration keys are **required** if not using the environment variables noted above:

- `email` - **string** - the email associated with your Simplisafe account
- `password` - **string** - your Simplisafe password
- `sessionID` - **string** - validated session ID (see [authorization](#authorization) below)


### Tokens

Simplisafe's API uses short-lived tokens; `simplisafe` returns a `token` **string** from its first session initiation; subsequent requests may reuse the same token.

> ⚠️ **Warning:** Depending on how your processes run, network conditions, API latency, etc., these tokens may expire mid-use. **If you aren't totally sure, don't reuse your token between transactions.**

---

## API

### Methods

**[Authorization](#authorization)**
- `simplisafe.authorize`
- `simplisafe.logout`

**[Status / info](#status--info)**
- `simplisafe.status`
- `simplisafe.systems`

**[Arm / disarm](#arm--disarm)**
- `simplisafe.arm`
- `simplisafe.disarm`

---

### Authorization

#### `simplisafe.authorize([params][, callback])` → `[Promise]`
#### ⚠️ Required step!

Before you can use `simplisafe`, you'll have to authorize a session (i.e. your `SIMPLISAFE_SESSION_ID`, which is just a unique identifier that you'll continue reusing). **You only need to authorize a session one time** – you should not attempt continued / ongoing reauthorization attempts.

If passed, params must be an **object**; this object may contain a `config` **object**.

Calls back or returns **error** or **string** of the authorized session ID.

To authorize an session, you must run `simplisafe.authorize` once with valid credentials, then authorize the session from the email Simplisafe will send to your account's email address.

- First, assuming your configuration env vars are set, initiate the request for an auth code by calling: `simplisafe.authorize()`
- Alternately, if passing a config object, initiate the request for an auth code by calling: `simplisafe.authorize({config: {...})`
- Go check your email and click the verificaiton link; you should now have an authorized session!

> ⚠️ **Warning:** if you change your `SIMPLISAFE_SESSION_ID`, or don't make use of that session for an extended period of time, you'll have to repeat the authorization process again.

##### Example
```javascript
// Initiate MFA flow via email
simplisafe.authorize({
  config: {
    email,
    password
  }
}, console.log)
```


#### `simplisafe.logout([params][, callback])` → `[Promise]`

Deauthorizes your current session ID. Only use this method when you're sure you no longer need to use this library, as all operations will cease to function until you authorize a fresh session ID.

If passed, params must be an **object**; this object may contain a `config` **object**.

Calls back or returns **error**.

Note: this action has no impact on your account, nor its associated email or password. This only relates to the session used by this library to access Simplisafe via API.

##### Example
```javascript
// Destroy your current session ID
simplisafe.logout({
  config: {
    email,
    password,
    sessionID
  }
}, console.log)
```

---

### Status / info

#### `simplisafe.status([params][, callback])` → `[Promise]`

If passed, params must be an **object**; this object may contain a `systemID` **string**, `config` **object**, and `token` **string**.

Calls back or returns **error** or **object** containing alarm arming status of a single system, and a reusable [`token`](#tokens):
- If your account only has access to a single system, you can opt not to specify a `systemID`
- If your account has access multiple alarms, **you must specify a systemID**
  - This is to prevent arming or disarming the wrong alarm, which would be *pretty not good*
- For reference, system states:
  - `status.off`: system is **disarmed**
  - `status.away`: system is **armed in away mode**
  - `status.home`: system is **armed in home mode**
  - (There may be other alarm statuses that I have not yet seen)

##### Example
```javascript
// Check your system's current arming status
const simplisafe = require('simplisafe')

simplisafe.status({ systemID: '76332481' }, console.log)
// {
//   status: 'off', // also: 'home', 'away'
//   token: 'foobar'
// }
```


#### `simplisafe.systems([params][, callback])` → `[Promise]`

If passed, params must be an **object**, and may contain a `config` **object**, and `token` **string**.

Calls back or returns **error** or **object** containing systems that your valid session has access to, and a reusable [`token`](#tokens)

##### Example
```javascript
// Check all your system data
const simplisafe = require('simplisafe')

simplisafe.systems(console.log)
// {
//   subscriptions: [
//     {
//       uid: 18423367, // User ID
//       sid: 76332481, // System ID
//       status: [Object], // Some interesting status data
//       location: [Object], // Some site-specific data
//       ...
//     }
//  ],
//  token: 'foobar'
// }
```

---

### Arm / disarm

#### `simplisafe.arm([params][, callback])` → `[Promise]`

If passed, params must be an **object**, and may contain a `systemID` **string**, `config` **object**, `options` **object**, and `token` **string**.

By default, calling `simplisafe.arm` will arm your system to `away` mode. To arm your system in `home` mode, include `options` with a boolean named `home` (see example below).

Calls back or returns **error** or **object** containing response after arming a system, and a reusable [`token`](#tokens)
- If your account only has access to a single system, you can opt not to specify a `systemID`
- If your account has access multiple alarms, **you must specify a systemID**
  - This is to prevent arming the wrong alarm, which would be *pretty not good*

##### Examples
```javascript
// Arm a specific alarm
const simplisafe = require('simplisafe')

simplisafe.arm({
  systemID: '76332481', // Optional if you only have one alarm system
  options: { home: true }
}, console.log)
// {
//   state: 'HOME',
//   stateUpdated: 1599000001,
//   exitDelay: 0,
//   token: 'foobar'
// }
```

```javascript
// Assuming your have only one Simplisafe alarm on your account
const simplisafe = require('simplisafe')

;(async () => {
  await simplisafe.arm()
})
```


#### `simplisafe.disarm([params][, callback])` → `[Promise]`

If passed, params must be an **object**, and may contain a `systemID` **string**, `config` **object**, and `token` **string**.

Calls back or returns **error** or **object** containing response after arming a system, and a reusable [`token`](#tokens)
- If your account only has access to a single system, you can opt not to specify a `systemID`
- If your account has access multiple alarms, **you must specify a systemID**
  - This is to prevent disarming the wrong alarm, which would be *pretty not good*

##### Examples
```javascript
// Disarm a specific system
const simplisafe = require('simplisafe')

simplisafe.disarm({ systemID: '76332481' }, console.log)
// {
//   state: 'OFF',
//   stateUpdated: 1599000001,
//   exitDelay: 0,
//   token: 'foobar'
// }
```

```javascript
// Assuming your have only one Simplisafe alarm on your account
const simplisafe = require('simplisafe')

;(async () => {
  await simplisafe.disarm()
})
```

---

## Contributing

- Please fork and submit PRs against `master`
- Make sure unit tests pass
- Integration tests should also pass, but are **not automated**
  - Because we wouldn't want real alarms getting armed and disarmed in the real world, integration tests are not part of the automated test suite
  - To run them, ensure you are using a valid API key¹, set up your local `.env` file, and test against your own hardware with a valid session

---

## Acknowledgments

Big ups to [Aaron Bach](https://github.com/bachya)'s [simplisafe-python](https://github.com/bachya/simplisafe-python) project for paving the way, and to [Justin Searls](https://github.com/searls) for `npm simplisafe`


## Notes

¹ `simplisafe` uses Simplisafe's unpublished API; if you'd like to contribute additional features or functionality, I suggest using their web client and monitoring request/response traffic, or checking out [simplisafe-python](https://github.com/bachya/simplisafe-python)

- This module was tested with a 2020-era Simplisafe system
- This module is not intended to provide complete coverage of the Simplisafe API, only the what's necessary to operate core functionality of an alarm
- Unfortunately, Simplisafe does not publish their API for consumer usage, so this may break at any time; Simplisafe name etc. trademark Simplisafe, Inc.
- **I am in no way responsible for any safety issues that arise from the use of this module!**
