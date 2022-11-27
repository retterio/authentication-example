import RDK, { Data, InitResponse, Response, StepResponse } from "@retter/rdk";
import { InitInputModel, Login, PrivateState } from "./types";
import mailjet from 'node-mailjet'

const mailjetClient = new mailjet({
    apiKey: '38bd8fe043c129615d3f7146398a6a0b',
    apiSecret: '0a168db997b4d139500b3ca5b1ba4a2c'
});

const rdk = new RDK();

//*******************************/

export async function authorizer(data: Data): Promise<Response> {
    const { methodName, identity, instanceId, action } = data.context

    switch (methodName) {  
        case 'INIT':
        case 'GET': {
            return { statusCode: 200 }
        }

        case 'STATE': {
            if (identity === 'developer') return { statusCode: 200 }
        }

        case 'login':
        case 'sendOTP': {
            if (instanceId && action === 'CALL') return { statusCode: 200 }
        }
    }

    return { statusCode: 403 };
}

export async function init(data: Data): Promise<Data> {
    data.state.private.email = data.request.body.email
    return data
}

export async function getState(data: Data): Promise<Response> {
    return { statusCode: 200, body: data.state };
}

export async function getInstanceId(data: Data): Promise<string> {
    return data.request.body.email
}

export async function sendOTP(data: Data): Promise<Data> {
    try {
        const { email } = data.state.private
        const otp = Math.floor(100000 + Math.random() * 900000)
        await mailjetClient
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "bahadir@rettermobile.com",
                            "Name": "Bahadır"
                        },
                        "To": [
                            {
                                "Email": email
                            }
                        ],
                        "Subject": "Greetings from Retter.",
                        "TextPart": "OTP Validation Email",
                        "HTMLPart": `OTP: ${otp}`,
                        "CustomID": "AppGettingStartedTest"
                    }
                ]
            })
        data.state.private.otp = otp
        data.response = {
            statusCode: 200,
            body: { emailSent: true },
        }
    } catch (error) {
        console.log(error)
        data.response = {
            statusCode: 400,
            body: { error: error.message },
        };
    }
    return data
}

export async function login(data: Data): Promise<Data> {
    try {
        const { otp: recivedOtp } = data.request.body as Login
        const { otp, email } = data.state.private as PrivateState

        if (recivedOtp !== otp) throw new Error(`OTP is wrong`);

        // Get existing USER INSTANCE
        let getUser = await rdk.getInstance({
            classId: "User",
            body: {
                email
            },
            lookupKey: {
                name: "email",
                value: email
            }
        })

        if (getUser.statusCode > 299) {
            // CREATE USER INSTANCE -> User class will connect email as lookup key itself
            getUser = await rdk.getInstance({
                classId: "User",
                body: {
                    email
                }
            })

            if (getUser.statusCode > 299) throw new Error('Couldnt create user instance')
        }

        const customToken = await rdk.generateCustomToken({
            userId: getUser.body.instanceId,
            identity: 'enduser'
        })

        data.state.private.relatedUser = getUser.body.instanceId
        data.state.private.otp = undefined
        data.response = {
            statusCode: 200,
            body: customToken,
        };

    } catch (error) {
        data.response = {
            statusCode: 400,
            body: { error: error.message },
        };
    }

    return data;
}