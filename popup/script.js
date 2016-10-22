// ABC - a generic, native JS (A)scii(B)inary(C)onverter.
// (c) 2013 Stephan Schmitz <eyecatchup@gmail.com>
// License: MIT, http://eyecatchup.mit-license.org
// URL: https://gist.github.com/eyecatchup/6742657

var conv = {
  toAscii: function(bin) {
    return bin.replace(/\s*[01]{8}\s*/g, function(bin) {
      return String.fromCharCode(parseInt(bin, 2))
    })
  },
  toBinary: function(str, spaceSeparatedOctets) {
    return str.replace(/[\s\S]/g, function(str) {
      str = conv.zeroPad(str.charCodeAt().toString(2));
      return !1 == spaceSeparatedOctets ? str : str + " "
    })
  },
  zeroPad: function(num) {
    return "00000000".slice(String(num).length) + num
  }
};



String.prototype.pack = function(secret, options){
		return Mary.pack(secret, this, options);
}

String.prototype.unpack = function(options){
		return Mary.unpack(this, options);
}

var Mary = {
	defaultChars : ["\u200c", "\u200d", "\u200e"],
	pack : function(_secret = "", text = "", options = {chars : this.defaultChars, nTimes : 1}){ //This particular piece of code will never get me any prize for programming skills, but hey; it works
				var result;
				var inTag;
				var htmlEnt = 0; //Ugly hack to prevent tokens from being added in a HTML tag
				var actualSize = 0;
				var inc;
				var secret;
				var nTimes = options.nTimes + 1; //small hack to avoid an injection in the beginning
				var pos = [];
		for(var j = 0; j < 2; j++){ //First we calculate the length of the string without tags and entities, then we insert our hidden tokens
				result = "";
				if(j == 1){
					if(options.everyN != undefined){
							nTimes = Math.floor(actualSize / options.everyN);
					}
					if(options.everyN > actualSize){
							nTimes = 2;
					}
					if(nTimes == 0){
						inc = 1;
						nTimes = text.length; 
					}
					else{
						inc = actualSize / nTimes;
					}
					for(var i = 0; i < nTimes; i++){ pos.push(Math.round(i * inc))}
					actualSize = 0;
				}
				for(var i = 0; i < text.length; i++){
				//We don't want to inject stuff in HTML tags
						if(actualSize != undefined){
							 secret = this.encode(_secret, options.chars);
						}
						else{
							secret = "";
						}
						if(text[i] == "<"){
                         if(pos.indexOf(actualSize) > -1)
                   		 result += secret;
								inTag = true;
						}
						//Not in HTML entities either
						var entity = text.substr(i, 8).match(/^&(.*?);/g);
						htmlEnt = 0;
						if(entity){
							htmlEnt =  entity[0].length;
 
                         if(pos.indexOf(actualSize) > -1)
								result += secret;
							result = result +  secret + text.substr(i, htmlEnt);
						}
						if((!inTag) && pos.indexOf(actualSize) > -1){
							result += secret;
						}
						if(text[i] == ">"){
							inTag = false;
						}
						i += htmlEnt;
						actualSize += htmlEnt;
		                if(text[i] != undefined){
								result += text[i];
						}
						if(!inTag){
							actualSize++;
						}
				}
		}
		return result.substr(secret.length, result.length); //remove the first injection
},
	unpack : function(text, options = {
		chars : this.defaultChars
	}){		
		var re = new RegExp(options.chars[2]+"\[^"+options.chars[2]+"]+"+options.chars[2], 'g');
		var results = [];
		var extracts = text.match(re);
		if(extracts){
			for(var i = 0; i < extracts.length; i++){
				var decoded = this.decode(extracts[i], options.chars); 
				if(results.indexOf(decoded) == -1){
					results.push(decoded);	
				}
			}
		}
		return results;
	},
	encode : function(text, chars){
			var binary = conv.toBinary(text, false);
			binary = binary.replace(/0/g, chars[0]).replace(/1/g, chars[1]);
			return chars[2] + binary + chars[2];
	},
	decode : function(text, chars){
			var r0 = new RegExp(chars[0],"g");
			var r1 = new RegExp(chars[1],"g");
			var r = new RegExp(chars[2],"g");
			var ascii = text.replace(r, "").replace(r0, "0").replace(r1, "1");
			return conv.toAscii(ascii);
	}

}


function showAbout(){
	document.getElementById("show-decoder").className = "";
	document.getElementById("show-about").className = "current";
	document.getElementById("show-settings").className = "";
	document.getElementById("decoder").style.display = "none";
	document.getElementById("about").style.display = "block";
	document.getElementById("settings").style.display = "none";
}

function showSettings(){
	document.getElementById("show-decoder").className = "";
	document.getElementById("show-about").className = "";
	document.getElementById("show-settings").className = "current";
	document.getElementById("decoder").style.display = "none";
	document.getElementById("about").style.display = "none";
	document.getElementById("settings").style.display = "block";
}
function showDecoder(){
	document.getElementById("show-settings").className = "";
	document.getElementById("show-about").className = "";
	document.getElementById("show-decoder").className = "current";
	document.getElementById("settings").style.display = "none";
	document.getElementById("about").style.display = "none";
	document.getElementById("decoder").style.display = "block";
}
function decode(){
	var txt = document.getElementById("input").value;
	var res = txt.unpack();
	if(res.length >= 1){
		document.getElementById("output").value = res.join(";");
	}
	else{
		document.getElementById("output").value = "No matches found :-(";
	}
}
function loadSettings(){
    chrome.storage.sync.get({'active' : true, 'after' : false, 'afterValue' : 20, 'times' : true, 'timesValue' : 2}, function(settings){
    	toggleActive(settings.active);
    	document.getElementById("after").checked = settings.after;
    	document.getElementById("times").checked = settings.times;
    	document.getElementById("after-value").value = settings.afterValue;
    	document.getElementById("times-value").value = settings.timesValue;
    });
}

function updateSettings(){
    chrome.storage.sync.set({
    	'after': document.getElementById("after").checked,
    	'times': document.getElementById("times").checked,
    	'afterValue' : document.getElementById("after-value").value,
    	'timesValue' : document.getElementById("times-value").value
    }, function() {sendSettings()});
}


function toggleActive(active, inform = false){
		if(active){
			document.getElementById("settings").className = "enabled";
		}
		if(!active){
			document.getElementById("settings").className = "disabled";
		}
    	document.getElementById("c-enabled").checked = active;
        chrome.storage.sync.set({'active': active}, function() {
        	if(inform){
        		  chrome.tabs.executeScript({
    				code: 'if(window.location.hostname == "mail.google.com") window.location.reload()'
  				}); 
        		window.close();
        	}
        });
}

window.onload = function(){
	document.getElementById("show-settings").onclick = function(){
		showSettings();
	}
	document.getElementById("show-decoder").onclick = function(){
		showDecoder();
	}
	document.getElementById("show-about").onclick = function(){
		showAbout();
	}
	document.getElementById("btn-decode").onclick = function(){
		decode();
	}
	document.getElementById("c-enabled").onclick = function(){
		toggleActive(document.getElementById("c-enabled").checked, true);
	}
	document.getElementById("after").onchange = function(){
		updateSettings();
	}
	document.getElementById("times").onchange = function(){
		updateSettings();
	}
	document.getElementById("after-value").onchange = function(){
		if(document.getElementById("after").checked)
		updateSettings();
	}
	document.getElementById("times-value").onchange = function(){
		if(document.getElementById("times").checked)
		updateSettings();
	}
	loadSettings();
}