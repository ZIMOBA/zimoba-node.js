const { createThirdPartyClient } = require("./thirdPartyClientFactory");
const { resendApiKey, resendUrl } = require("../config/env");
const { Resend } = require("resend")

const resendEmailApi = createThirdPartyClient({
  name: "resend",
  baseUrl: resendUrl,
  apiKey: resendApiKey
})

const resend = new Resend(resendApiKey)

const getTemplateId = async (templateName) => {
  const template = await resend.templates.get(templateName)
  return template
}

const sendVerificationCodeEmail = async(
  to,
  { verificationCode, firstName, companyName = "Zimoba", locale = "fr" },
) => {
  const templateId = locale === "fr" ? "verification-code" : "verification-code-english";
  const { data, error } = await resendEmailApi.call('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: `${companyName} <support@noreply.zimoba.com>`,
      to: [to],
      template: {
        id: templateId,
        variables: {
          verification_code: verificationCode,
          first_name: firstName,
          companyName: companyName
        },
      },
    }),
  });
  if (error) {
    console.error("Failed to send a verification email: ", error)
    throw error
  }
  return data
};

module.exports = { getTemplateId, sendVerificationCodeEmail }
