const isLocalDevHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const shouldRegisterServiceWorker = "serviceWorker" in navigator && !isLocalDevHost;

if (shouldRegisterServiceWorker) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch(() => {
        // The game still works as a normal web page if PWA registration fails.
      });
  });

  let isRefreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });
}
