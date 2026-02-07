/**
 * Auth.gs
 * Handles the OAuth2 flow to connect FreeAgent securely.
 */

// Configures the OAuth2 service
function getService_() {
  return OAuth2.createService('FreeAgent')
    .setAuthorizationBaseUrl('https://api.freeagent.com/v2/approve_app')
    .setTokenUrl('https://api.freeagent.com/v2/token_endpoint')
    .setClientId(PropertiesService.getScriptProperties().getProperty('CLIENT_ID'))
    .setClientSecret(PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET'))
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties()) // Stores tokens in UserProperties
    .setCache(CacheService.getUserCache());
}

// Handles the callback from FreeAgent
function authCallback(request) {
  const service = getService_();
  const authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab and return to the Google Sheet.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab.');
  }
}

// Logs the authorization URL - RUN THIS FUNCTION FIRST
function logRedirectUri() {
  const service = getService_();
  console.log(service.getRedirectUri());
}
