import RDK, { Data, InitResponse, Response, StepResponse } from "@retter/rdk";
import { InitInputModel, Login, PrivateState } from "./types";
var postmark = require('postmark')

const rdk = new RDK();

const client = new postmark.ServerClient("2566b989-fd65-4ff1-b056-4d3ad509a624");

const sendOtpMail = async (email: string, otp: number): Promise<boolean> => {
    try {
        await client.sendEmail({
            "From": "bahadir@rettermobile.com",
            "To": `${email}`,
            "Subject": "Hello from Postmark",
            "HtmlBody": `OTP: ${otp}`,
            "TextBody": "Hello from Postmark!",
            "MessageStream": "oto"
        });
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