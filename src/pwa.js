if ("serviceWorker" in navigator) {
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
