// SW Update Manager
// Copyright 2018 Caleb Evans
// Released under the MIT license

// The code and logic in this package is based on the advanced Workbox recipe,
// "Offer a page reload for users":
// <https://developers.google.com/web/tools/workbox/guides/advanced-recipes#offer_a_page_reload_for_users>
;(function () {

// Register a service worker that is implicitly set to precache all app assets,
// and provide a mechanism for detecting updates to the service worker
class SWUpdateManager {

  constructor(serviceWorker, {reloadOnUpdate = true} = {}) {
    // User callbacks
    this.events = {
      updateAvailable: [],
      update: []
    };

    // Internal state
    this.serviceWorker = serviceWorker;
    this.isUpdateAvailable = false;
    this.reloadOnUpdate = reloadOnUpdate;

    if (!serviceWorker) {
      throw new Error('SW Update Manager: Service worker required');
    }
  }

  checkForUpdates() {
    return this.serviceWorker.then((registration) => {
      this.registration = registration;
      this.onRegisterServiceWorker();
      return registration;
    });
  }

  on(eventName, eventCallback) {
    this.events[eventName].push(eventCallback);
  }

  onRegisterServiceWorker() {
    // Track updates to the Service Worker.
    if (!navigator.serviceWorker.controller) {
      // The window client isn't currently controlled so it's a new service
      // worker that will activate immediately
      return;
    }

    // When the user asks to refresh the UI, we'll need to reload the window
    let preventDevToolsReloadLoop;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Ensure refresh is only called once.
      // This works around a bug in the "Update on reload" DevTools option.
      if (preventDevToolsReloadLoop) {
        return;
      }
      preventDevToolsReloadLoop = true;
      this.events.update.forEach((callback) => callback());
      if (this.reloadOnUpdate) {
        window.location.reload();
      }
    });

    this.onNewServiceWorker(() => {
      this.isUpdateAvailable = true;
      this.events.updateAvailable.forEach((callback) => callback());
    });
  }

  update() {
    if (!this.isUpdateAvailable) {
      return;
    }
    if (!this.registration.waiting) {
      // Just to ensure registration.waiting is available before
      // calling postMessage()
      return;
    }
    this.registration.waiting.postMessage({
      updateManagerEvent: 'update'
    });
  }

  onNewServiceWorker(callback) {
    if (this.registration.waiting) {
      // SW is waiting to activate. Can occur if multiple clients open and
      // one of the clients is refreshed.
      return callback();
    }

    if (this.registration.installing) {
      return this.listenInstalledStateChange(callback);
    }

    // We are currently controlled so a new SW may be found...
    // Add a listener in case a new SW is found,
    this.registration.addEventListener('updatefound', () => {
      this.listenInstalledStateChange(callback);
    });
  }

  listenInstalledStateChange(callback) {
    this.registration.installing.addEventListener('statechange', (event) => {
      if (event.target.state === 'installed') {
        // A new service worker is available, inform the user
        callback();
      }
    });
  }

}

if (typeof module !== 'undefined') {
	module['exports'] = SWUpdateManager;
} else {
	window.SWUpdateManager = SWUpdateManager;
}

}());
