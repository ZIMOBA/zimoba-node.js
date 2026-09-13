const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require("undici");

process.env.RESEND_PRODKEY = 'test-key'
process.env.RESEND_PRODKEY_URL