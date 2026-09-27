// One bounded retry for unavailable/slow position providers, never for denied permission.
export function locate(geo, {onSuccess, onError, onRetry, isCurrent}) {
  function attempt(retry) {
    if (!isCurrent()) return;
    try {
      geo.getCurrentPosition(position => {
        if (isCurrent()) onSuccess(position);
      }, error => {
        if (!isCurrent()) return;
        if (!retry && (error.code === 2 || error.code === 3)) {
          onRetry();
          attempt(true);
        } else onError(error);
      }, {enableHighAccuracy: retry, timeout: retry ? 30000 : 20000, maximumAge: retry ? 0 : 60000});
    } catch (error) {
      if (isCurrent()) onError({code: error.name === 'SecurityError' ? 1 : 2});
    }
  }
  attempt(false);
}
export function locationError(code) {
  if (code === 1) return [
    'Location permission is blocked. Allow location for this site in your browser and device settings, then try again. ZIP search still works.',
    'El permiso de ubicación está bloqueado. Permite la ubicación de este sitio en el navegador y el dispositivo, y vuelve a intentar. Puedes seguir buscando por ZIP.'
  ];
  if (code === 3) return [
    'Location took too long after two attempts. Try again with a better connection, or enter your ZIP.',
    'La ubicación tardó demasiado después de dos intentos. Inténtalo con una mejor conexión o ingresa tu ZIP.'
  ];
  return [
    'Your browser could not provide a location. Check that device Location Services are on. If you opened this inside an app, try the site directly in Chrome or Safari, or enter your ZIP.',
    'Tu navegador no pudo proporcionar la ubicación. Revisa que la localización del dispositivo esté activada. Si abriste la página dentro de una app, pruébala directamente en Chrome o Safari, o ingresa tu ZIP.'
  ];
}
