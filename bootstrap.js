const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');
const stringBundles = Services.strings.createBundle('chrome://jsalertmsgbox/locale/browserOverlay.properties');

const observers = {
	contentCreated: {
		observe(aWindow, aTopic) {
			if(!(aWindow instanceof Ci.nsIDOMWindow && aTopic == 'content-document-global-created')) return;
			try {
				aWindow.QueryInterface(Ci.nsIDOMChromeWindow);
				return;
			} catch(e) {}
			
			var defaultTitle = '[' + stringBundles.GetStringFromName('defaultTitleUntitled') + ']'
			if(aWindow.wrappedJSObject.location && aWindow.wrappedJSObject.location.hostname)
				defaultTitle = stringBundles.GetStringFromName('defaultTitle').replace('$HOST', aWindow.wrappedJSObject.location.protocol + '//' + aWindow.wrappedJSObject.location.hostname);
			const chklbl = stringBundles.GetStringFromName('checklabel');
			var alertCount = 0, confirmCount = 0;
			var noalert = false, noconfirm = false;
			
			const uid = Math.round(Math.random() * 100000).toString();
			
			aWindow.wrappedJSObject['_OLDALERT_alert_' + uid] = function alert(prpt = '', title = defaultTitle) {
				if(noalert) return;
				++alertCount;
				if(alertCount < 2)
					return Services.prompt.alert(aWindow, title, prpt);
				const dontPrompt = { value: false };
				const retval = Services.prompt.alertCheck(aWindow, title, prpt, chklbl, dontPrompt);
				if(dontPrompt.value)
					noalert = true;
				return retval;
			};
			
			aWindow.wrappedJSObject['_OLDALERT_confirm_' + uid] = function confirm(prpt = '', title = defaultTitle) {
				if(noconfirm) return false;
				++confirmCount;
				if(confirmCount < 2)
					return Services.prompt.confirm(aWindow, title, prpt);
				const dontPrompt = { value: false };
				const retval = Services.prompt.confirmCheck(aWindow, title, prpt, chklbl, dontPrompt);
				if(dontPrompt.value)
					noconfirm = true;
				return retval;
			};
			
			aWindow.wrappedJSObject['_OLDALERT_prompt_' + uid] = function prompt(prpt = '', value = '', title = defaultTitle) {
				const input = { value };
				const ret = Services.prompt.prompt(aWindow, title, prpt, input, null, { value: false });
				if(!ret) return null;
				return input.value;
			};
			
			const sandbox = new Cu.Sandbox(aWindow, {
				sameZoneAs: aWindow,
				sandboxPrototype: aWindow,
				wantXrays: false,
			});
			
			Cu.evalInSandbox('window.alert = function alert() { return _OLDALERT_alert_' + uid + '(arguments[0], arguments[1]); };', sandbox);
			Cu.evalInSandbox('window.confirm = function confirm() { return _OLDALERT_confirm_' + uid + '(arguments[0], arguments[1]); };', sandbox);
			Cu.evalInSandbox('window.prompt = function prompt() { return _OLDALERT_prompt_' + uid + '(arguments[0], arguments[1], arguments[2]); };', sandbox);
			
			Cu.evalInSandbox('window.alert.toString = function toString() { return "function alert() {\\n    [native code]\\n}"; };', sandbox);
			Cu.evalInSandbox('window.confirm.toString = function toString() { return "function confirm() {\\n    [native code]\\n}"; };', sandbox);
			Cu.evalInSandbox('window.prompt.toString = function toString() { return "function prompt() {\\n    [native code]\\n}"; };', sandbox);
			
			Cu.evalInSandbox('window.alert.toSource = function toSource() { return "function alert() {\\n    [native code]\\n}"; };', sandbox);
			Cu.evalInSandbox('window.confirm.toSource = function toSource() { return "function confirm() {\\n    [native code]\\n}"; };', sandbox);
			Cu.evalInSandbox('window.prompt.toSource = function toSource() { return "function prompt() {\\n    [native code]\\n}"; };', sandbox);
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
