import RDK, { Data, InitResponse, Response, StepResponse } from "@retter/rdk";
import { InitInputModel, Login, PrivateState } from "./types";
import mailjet from 'node-mailjet'

const mailjetClient = new mailjet({
    apiKey: '38bd8fe043c129615d3f7146398a6a0b',
    apiSecret: '0a168db997b4d139500b3ca5b1ba4a2c'
});

const rdk = new RDK();

const sendOtpMail = async (email: string, otp: number): Promise<boolean> => {
    try {
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
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

//*******************************/

export async function authorizer(data: Data): Promise<Response> {
    const { methodName } = data.context
    if(methodName === "login") {
        return {statusCode: 200}
    }
    if(methodName === "init") {
        return {statusCode: 200}
    }
    return { statusCode: 403 };
}

export async function init(data: Data): Promise<Data> {
    const { email } = data.request.body as InitInputModel
    const otp = Math.floor(100000 + Math.random() * 900000)
    const response = await sendOtpMail(email, otp)
    if (response === false) throw new Error(`There was an error when sending otp email.`);

    data.state.private = {
        email,
        otp
    } as PrivateState
    return data
}

export async function getState(data: Data): Promise<Response> {
    return { statusCode: 200, body: data.state };
}

export async function login(data: Data): Promise<Data> {
    try {
        const { otp: recivedOtp } = data.request.body as Login
        const { otp, email } = data.state.private as PrivateState

        if (recivedOtp !== otp) throw new Error(`OTP is wrong`);

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

        if (getUser.statusCode === 404) {
            // User class will connect email as lookup key itself
            getUser = await rdk.getInstance({
                classId: "User",
                body: {
                    email
                }
            })
        }

        const customToken = await rdk.generateCustomToken({
            userId: getUser.body.instanceId,
            identity: 'enduser'
        })

        data.response = {
            statusCode: 200,
            body: { message: customToken },
        };

    } catch (error) {
        data.response = {
            statusCode: 400,
            body: { error: error.message },
        };
    }

    return data;
}