# SW Update Manager

*Copyright 2018 Caleb Evans*  
*Released under the MIT license*  

SW Update Manager is a front-end package that allows you to detect updates to
your service worker and prompt the user to update with a notification.

**Please note that this project is still in active development, meaning the API
is still in flux.**

## Getting Started

### 1. Load the script into your application

First, you need to load the SW Update Manager script into the front-end portion
of your application. You can do this via `<script>` tag or through your build
process.

```html
<script src="node_modules/sw-update-manager/sw-update-manager.js"></script>
```

```js
var SWUpdateManager = require('sw-update-manager');
```

```js
import SWUpdateManager from 'sw-update-manager';
```

### 2. Add front-end JS

In your front-end JavaScript, you will need to initialize a new
`SWUpdateManager` instance and ensure it is accessible by the code that spawns
the update notification.

```js
if (navigator.serviceWorker) {
  let serviceWorker = navigator.serviceWorker.register('service-worker.js');
  this.updateManager = new SWUpdateManager(serviceWorker);
  // Use the optional updateAvailable hook to re-render the UI (or run any other
  // necessary code) when an update is available
  this.updateManager.on('updateAvailable', () => this.renderView());
  // You must explicitly tell SW Update Manager when to check for updates to the
  // service worker
  this.updateManager.checkForUpdates();
}
```

You can use the `isUpdateAvailable` property on your `SWUpdateManager` object to
decide when to display the update notification.

```jsx
<div className={`update-notification ${this.updateManager.isUpdateAvailable ? 'visible': 'hidden'}`}></div>
```

Whenever you decide to trigger the service worker update, call the `update()`
method on your `SWUpdateManager` object. You can call `update()` however you
want, but for a simple user experience, bind a click event to the update
notification you show to the user (a long as you instruct the user to click the
notification to update).

```jsx
<div className='update-notification' onclick={() => this.updateManager.update()}></div>
```

All of these code examples are using React/JSX because the syntax is familiar to
many developers. However, you could effortlessly use any of these features with
another library or in vanilla JavaScript.

### 3. Listen for update requests to your service worker

The final step in configuring SW Update Manager is to listen for events from the
service worker itself.

```js
// When an update to the service worker is detected, the front end will request
// that the service worker be updated immediately; listen for that request here
self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }
  if (event.data.updateManagerEvent === 'update') {
    self.skipWaiting();
  }
});
```

## Other API features

### Controlling update behavior

If you'd like to stop SW Update Manager from reloading the page automatically
when calling `update()`, set `reloadOnUpdate` to `false`. You can do this on
initialization on the update manager, or afterwards.

```js
this.updateManager = new SWUpdateManager(serviceWorker, {
  reloadOnUpdate: false
});
```

```js
this.updateManager = new SWUpdateManager(serviceWorker);
this.updateManager.reloadOnUpdate = false;
```

You can also run your own code before the update by listening for the `update`
event.

```js
// The page will still reload automatically after this callback fires, unless
// you set reloadOnUpdate to false as described above
this.updateManager.on('update', () => {
  localStorage.setItem('lastUpdateTime', Date.now());
});
```

The `update` event fires only when the service worker is actually able to be
updated. Calling the `update()` method a second time will not fire the event
callbacks again, nor will the callbacks fire at all if the service worker is
missing the aforementioned listener code.
