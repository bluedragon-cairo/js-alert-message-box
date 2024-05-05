const prompts = Cc['@mozilla.org/embedcomp/prompt-service;1'].getService(Ci.nsIPromptService);
const os = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
const stringBundles = Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService).createBundle('chrome://jsalertmsgbox/locale/browserOverlay.properties');


os.addObserver({
    observe: function(win, _t) {
        if(win instanceof Ci.nsIDOMWindow && _t == 'content-document-global-created') {
			const defaultTitle = '[' + stringBundles.GetStringFromName('defaultTitle') + ']';
			const chklbl = stringBundles.GetStringFromName('checklabel');
			// const defaultTitle = win.wrappedJSObject.location.protocol + '//' + win.wrappedJSObject.location.hostname + ' 페이지 정보: ';
			var alertCount = 0, confirmCount = 0;
			var noalert = false, noconfirm = false;
			
            win.wrappedJSObject._OLDALERT_alert = function alert(prpt = '', title = defaultTitle) {
				if(noalert) return;
				++alertCount;
				if(alertCount < 2)
					return prompts.alert(win, title, prpt);
				const dontPrompt = { value: false };
				const retval = prompts.alertCheck(win, title, prpt, chklbl, dontPrompt);
				if(dontPrompt.value)
					noalert = true;
				return retval;
			};
			
            win.wrappedJSObject._OLDALERT_confirm = function confirm(prpt = '', title = defaultTitle) {
				if(noconfirm) return false;
				++confirmCount;
				if(confirmCount < 2)
					return prompts.confirm(win, title, prpt);
				const dontPrompt = { value: false };
				const retval = prompts.confirmCheck(win, title, prpt, chklbl, dontPrompt);
				if(dontPrompt.value)
					noconfirm = true;
				return retval;
			};
			
            win.wrappedJSObject._OLDALERT_prompt = function prompt(prpt = '', value = '', title = defaultTitle) {
				const input = { value };
				const ret = prompts.prompt(win, title, prpt, input, null, { value: false });
				if(!ret) return null;
				return input.value;
			};
			
			win.wrappedJSObject.eval('window.alert = function alert(message, title) { return _OLDALERT_alert(message, title); };');
			win.wrappedJSObject.eval('window.confirm = function confirm(message, title) { return _OLDALERT_confirm(message, title); };');
			win.wrappedJSObject.eval('window.prompt = function prompt(message, def, title) { return _OLDALERT_prompt(message, def, title); };');
			
			win.wrappedJSObject.eval('window.alert.toString = function toString() { return "function alert() {\\n    [native code]\\n}"; };');
			win.wrappedJSObject.eval('window.confirm.toString = function toString() { return "function confirm() {\\n    [native code]\\n}"; };');
			win.wrappedJSObject.eval('window.prompt.toString = function toString() { return "function prompt() {\\n    [native code]\\n}"; };');
        }
    }
}, 'content-document-global-created', false);
