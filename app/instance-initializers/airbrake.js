/* global Airbrake*/
import Ember from "ember";
import config from "../config/environment";

var isSetup = false;

function setupAirbrake(container) {
  var airbrake = new airbrakeJs.Client({
    projectId: config.airbrake.projectId,
    projectKey: config.airbrake.projectKey
  });
  if (config.airbrake.host) {
    airbrake.setHost(config.airbrake.host);
  }

  var preprocessor = function(err) { return err; };
  if (config.airbrake.preprocessor) {
    preprocessor = container.lookup(config.airbrake.preprocessor);
  }
  if (config.airbrake.filter) {
    airbrake.addFilter(container.lookup(config.airbrake.filter));
  }
  function pushError(err) {
    airbrake.notify(preprocessor(err));
  }

  var originalOnError = Ember.onerror || Ember.K;
  Ember.onerror = function(err) { // any ember error
    originalOnError(err);
    pushError(err)
  };
  window.onerror = function(message, file, line, column, error){ // window general errors.
    if (message === 'Script error.') {
      // Ignore.
      return;
    }

    if (error) {
      pushError({error: error})
    } else {
      pushError({error: {
        message: message,
        fileName: file,
        lineNumber: line,
        columnNumber: column || 0
      }});
    }
  };
}

export function initialize(container) {
  if (config.airbrake && !isSetup) {
    isSetup = true;
    setupAirbrake(container);
  }
}

export default {
  name: 'airbrake',
  initialize: initialize
};
