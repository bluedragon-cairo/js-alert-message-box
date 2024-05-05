const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');
const stringBundles = Services.strings.createBundle('chrome://jsalertmsgbox/locale/browserOverlay.properties');

const observers = {
	contentCreated: {
		observe(win, topic) {
			if(!(win instanceof Ci.nsIDOMWindow && topic == 'content-document-global-created')) return;
			
			var defaultTitle = '[' + stringBundles.GetStringFromName('defaultTitleUntitled') + ']'
			if(win.wrappedJSObject.location && win.wrappedJSObject.location.hostname)
				defaultTitle = stringBundles.GetStringFromName('defaultTitle').replace('$HOST', win.wrappedJSObject.location.protocol + '//' + win.wrappedJSObject.location.hostname);
			const chklbl = stringBundles.GetStringFromName('checklabel');
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
		},
		register() {
			Services.obs.addObserver(observers.contentCreated, 'content-document-global-created', false);
		},
		unregister() {
			Services.obs.removeObserver(observers.contentCreated, 'content-document-global-created');
		},
	},
};

function startup(data, reason) {
	observers.contentCreated.register();
}

function shutdown(data, reason) {
	observers.contentCreated.unregister();
}

function install() {}

function uninstall() {}
