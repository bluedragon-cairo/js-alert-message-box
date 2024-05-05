const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');
const stringBundles = Services.strings.createBundle('chrome://jsalertmsgbox/locale/browserOverlay.properties');

Services.obs.addObserver({
    observe: function(win, _t) {
        if(!(win instanceof Ci.nsIDOMWindow && _t == 'content-document-global-created')) return;
		
		const defaultTitle = '[' + stringBundles.GetStringFromName('defaultTitle') + ']';
		const chklbl = stringBundles.GetStringFromName('checklabel');
		// const defaultTitle = win.wrappedJSObject.location.protocol + '//' + win.wrappedJSObject.location.hostname + ' 페이지 정보: ';
		var alertCount = 0, confirmCount = 0;
		var noalert = false, noconfirm = false;
		
		win.wrappedJSObject._OLDALERT_alert = function alert(prpt = '', title = defaultTitle) {
			if(noalert) return;
			++alertCount;
			if(alertCount < 2)
				return Services.prompt.alert(win, title, prpt);
			const dontPrompt = { value: false };
			const retval = Services.prompt.alertCheck(win, title, prpt, chklbl, dontPrompt);
			if(dontPrompt.value)
				noalert = true;
			return retval;
		};
		
		win.wrappedJSObject._OLDALERT_confirm = function confirm(prpt = '', title = defaultTitle) {
			if(noconfirm) return false;
			++confirmCount;
			if(confirmCount < 2)
				return Services.prompt.confirm(win, title, prpt);
			const dontPrompt = { value: false };
			const retval = Services.prompt.confirmCheck(win, title, prpt, chklbl, dontPrompt);
			if(dontPrompt.value)
				noconfirm = true;
			return retval;
		};
		
		win.wrappedJSObject._OLDALERT_prompt = function prompt(prpt = '', value = '', title = defaultTitle) {
			const input = { value };
			const ret = Services.prompt.prompt(win, title, prpt, input, null, { value: false });
			if(!ret) return null;
			return input.value;
		};
		
		try {
			win.QueryInterface(Ci.nsIDOMChromeWindow);
			return;
		} catch(e) {}
		
		const sandbox = new Cu.Sandbox(win, {
			sameZoneAs: win,
			sandboxPrototype: win,
			wantXrays: false,
        });
		
		Cu.evalInSandbox('window.alert = function alert(message, title) { return _OLDALERT_alert(message, title); };', sandbox);
		Cu.evalInSandbox('window.confirm = function confirm(message, title) { return _OLDALERT_confirm(message, title); };', sandbox);
		Cu.evalInSandbox('window.prompt = function prompt(message, def, title) { return _OLDALERT_prompt(message, def, title); };', sandbox);
		
		Cu.evalInSandbox('window.alert.toString = function toString() { return "function alert() {\\n    [native code]\\n}"; };', sandbox);
		Cu.evalInSandbox('window.confirm.toString = function toString() { return "function confirm() {\\n    [native code]\\n}"; };', sandbox);
		Cu.evalInSandbox('window.prompt.toString = function toString() { return "function prompt() {\\n    [native code]\\n}"; };', sandbox);
    }
}, 'content-document-global-created', false);
