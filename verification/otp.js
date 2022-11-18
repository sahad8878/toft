const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const serviceId=process.env.SSID

function sendSms(phone) {
    const client = require('twilio')(accountSid, authToken);

    client.verify.v2.services(serviceId)
                .verifications
                .create({to: `+91${phone}`, channel: 'sms'})
                .then(verification => console.log(verification.status));
}


function verifySms(phone,otp) {
    const client = require('twilio')(accountSid, authToken);

    return new Promise((resolve,reject)=>{
        client.verify.v2.services(serviceId)
        .verificationChecks
        .create({to: `+91${phone}`, code: otp})
        .then((verification_check) =>{
             console.log(verification_check.status)
             resolve(verification_check)});


    })

}

module.exports ={sendSms,verifySms}





