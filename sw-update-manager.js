;(function () {

// Register a service worker that is implicitly set to precache all app assets,
// and provide a mechanism for detecting updates to the service worker
class UpdateManager {

  constructor({workerURL = 'service-worker.js', workerOptions = null, updateAvailable = null} = {}) {
    // User callbacks
    this.events = {updateAvailable};

    // Internal state
    this.isUpdateAvailable = false;

    if (!navigator.serviceWorker) {
      return;
    }
    let worker = navigator.serviceWorker.register(workerURL, workerOptions);
    worker.then((registration) => {
      this.registration = registration;
      this.onRegisterServiceWorker();
    });
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
      // This works around a bug in "force update on reload".
      if (preventDevToolsReloadLoop) {
        return;
      }
      preventDevToolsReloadLoop = true;
      window.location.reload();
    });

    this.onNewServiceWorker(() => {
      this.isUpdateAvailable = true;
      if (this.events.updateAvailable) {
        this.events.updateAvailable();
      }
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
      swUpdateManagerEvent: 'update'
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
	module['exports'] = UpdateManager;
} else {
	window.UpdateManager = UpdateManager;
}

}());
