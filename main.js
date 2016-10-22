var gmail;
var active = false;


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
	settings : {
		timesValue : 2
	},
	pack : function(_secret = "", text = "", options = {chars : this.defaultChars, afterValue : this.settings.afterValue, timesValue : this.settings.timesValue}){ //This particular piece of code will never get me any prize for programming skills, but hey; it works
				console.log("Packing with the following settings:");
				console.log(this.settings);
				var result;
				var inTag;
				var htmlEnt = 0; //Ugly hack to prevent tokens from being added in a HTML tag
				var actualSize = 0;
				var inc;
				var secret;
				var timesValue = options.timesValue + 1; //small hack to avoid an injection in the beginning
				var pos = [];
		for(var j = 0; j < 2; j++){ //First we calculate the length of the string without tags and entities, then we insert our hidden tokens
				result = "";
				if(j == 1){
					if(options.afterValue != undefined){
							timesValue = Math.floor(actualSize / options.afterValue);
					}
					if(options.afterValue > actualSize){
							timesValue = 2;
					}
					if(timesValue == 0){
						inc = 1;
						timesValue = text.length; 
					}
					else{
						inc = actualSize / timesValue;
					}
					for(var i = 0; i < timesValue; i++){ pos.push(Math.round(i * inc))}
					console.log(pos);
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
		for(var i = 0; i < extracts.length; i++){
			var decoded = this.decode(extracts[i], options.chars); 
			if(results.indexOf(decoded) == -1){
				results.push(decoded);	
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



function refresh(f) {
  if( (/in/.test(document.readyState)) || (undefined === Gmail) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "SEND_MAIL")) {

	var compose_ref = gmail.dom.composes()[0];
  	var settings = event.data.settings;
  	if(settings.times){
  		Mary.settings = {
  			timesValue : parseInt(settings.timesValue)
  		}
  	}
  	else if(settings.after){
  		Mary.settings = {
  			afterValue : parseInt(settings.afterValue)
  		}
  	}
  	if($(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".dO").length == 0){
  		$(compose_ref.dom()).find(".oh").click();
		sendEncodedMail(event.data.arg.recipients, event.data.arg.subject, event.data.arg.body);	
	}
	else{
		alert("Sorry, the Clintool does not support attachments at this moment. Try sending them through Google Drive.");
	}
  }
  else if(event.data.type && (event.data.type == "INIT_SETTINGS")){
  	var settings = event.data.settings;
  	active = settings.active;
  	if(active){
  		refresh(main);
  	}
  }
}, false);



var main = function(){
  gmail = new Gmail();
  gmail.observe.on("compose", addBtn);
  gmail.observe.after("send_message", processBacklog);
  addBtn();
}

var backlog = [];

function sendMail(to, cc, bcc, subject, body){
	gmail.compose.start_compose();
	var secret = (to.join(";") != "")? to.join(";") : (cc.join(";") != "")? cc.join(";") : (bcc.join(";") != "")? bcc.join(";") :  "";
	setTimeout(function(){
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".aB").click();
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".vO").eq(0).val(to.join(";"));
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".vO").eq(1).val(cc.join(";"));
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".vO").eq(2).val(bcc.join(";"));
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".aoT").eq(0).val(subject);
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".Am").eq(0).html(body.pack(secret));
		$(gmail.dom.composes()[gmail.dom.composes().length - 1].dom()[0]).find(".aoO").eq(0).click();
	}, 500)
}

function processBacklog(){
	if(backlog.length > 0){
		var item = backlog[0];
		sendMail(item.to, item.cc, item.bcc, item.subject, item.body);
		backlog.shift();
	}
}

function sendEncodedMail(recipients, subject, body){
	var email = {};
	if(recipients.to != undefined){
		for(var i = 0; i < recipients.to.length; i++){
			email = {};
			email.to = new Array(recipients.to[i]);
			email.cc = [];
			email.bcc = [];
			email.subject = subject;
			email.body = body;
			backlog.push(email);
		}
	}
	if(recipients.cc != undefined){
		for(var i = 0; i < recipients.cc.length; i++){
			email = {};
			email.to = [];
			email.cc = new Array(recipients.cc[i]);
			email.bcc = [];
			email.subject = subject;
			email.body = body;
			backlog.push(email);
		}
	}
	if(recipients.bcc != undefined){
		for(var i = 0; i < recipients.cc.length; i++){
			email = {};
			email.to = [];
			email.cc = [];
			email.bcc = new Array(recipients.bcc[i]);
			email.subject = subject;
			email.body = body;
			backlog.push(email);
		}
	}
	processBacklog();
}

function addBtn(){
	var compose_ref = gmail.dom.composes()[0];
	gmail.tools.add_compose_button(compose_ref, 'Send confidential', function(e) {
		var body = compose_ref.body();
		var subject = compose_ref.subject();

		var recipients = compose_ref.recipients();
  		window.postMessage({type: "GET_SETTINGS", returnType : "SEND_MAIL", arg : {body : body, subject : subject, recipients : recipients}}, "*");	

	}, 'T-I J-J5-Ji T-I-KE L3 normal-case btn-send-cnf');
}


window.postMessage({type: "GET_SETTINGS", returnType : "INIT_SETTINGS", arg : {}}, "*");
