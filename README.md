# SW Update Manager

*Copyright 2018 Caleb Evans*  
*Released under the MIT license*  

SW Update Manager is a front-end package that allows you to detect updates to
your service worker and prompt the user to update with a notification.

**Please note that this project is still in active development, meaning the API
is still in flux.**

## Usage

### 1. Load the script into your application

First, you need to load the SW Update Manager script into the front-end portion
of your application. You can do this via `<script>` tag or through your build
process.

```html
<script src="scripts/sw-update-manager.js"></script>
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
}
```

You can use the `isUpdateAvailable` property on your `UpdateManager` object to
decide when to display the update notification.

```js
if (this.updateManager.isUpdateAvailable) {
  $('.update-notification').addClass('visible');
} 
```

Then, you can call the `update()` method on your `UpdateManager` object.

```js
// You can call `update()` however you want, but for a simple user experience,
// bind a click event to the update notification you show to the user (a long as
// you instruct the user to click the notification to update)
$('.update-notification').on('click', () => {
  this.updateManager.update();
});
```

All of these code examples are using jQuery to keep the syntax simple and focus
on the API. However, you could effortlessly use any of these features with
React/JSX or another library.

### 3. Listen for update requests to your service worker

The final step in configuring SW Update Manager is to listen for events from the
service worker itself.

```
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
