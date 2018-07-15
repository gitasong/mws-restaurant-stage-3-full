// This script courtesy of https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', {scope: '/'})
  .then((reg) => console.log('Registration succeeded. Scope is ' + reg.scope))
  .catch((error) => console.log('Registration failed with ' + error));
};
