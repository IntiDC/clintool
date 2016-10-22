
var j = document.createElement('script');
j.src = chrome.extension.getURL('jquery-2.2.4.min.js');
(document.head || document.documentElement).appendChild(j);

var g = document.createElement('script');
g.src = chrome.extension.getURL('gmail.js');
(document.head || document.documentElement).appendChild(g);

var m = document.createElement('script');
m.src = chrome.extension.getURL('main.js');
(document.head || document.documentElement).appendChild(m);


window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "GET_SETTINGS")) {
  	    chrome.storage.sync.get({'active' : true, 'after' : false, 'afterValue' : 20, 'times' : true, 'timesValue' : 2}, function(settings){
    		window.postMessage({ type: event.data.returnType, arg : event.data.arg, settings: settings}, "*");
    });
  }
}, false);