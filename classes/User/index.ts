import RDK, { Data, InitResponse, Response, StepResponse } from "@retter/rdk";
import { v4 as uuidv4 } from 'uuid';
import { UserInitInputModel } from "./rio";
import { PrivateState, UserInitModel } from "./types";

const rdk = new RDK();

//**********************************//

export async function authorizer(data: Data): Promise<Response> {
    const { identity, methodName,instanceId, userId } = data.context
    if (identity === "enduser" && methodName === "getProfile" && userId === instanceId) {
        return { statusCode: 200 };
    }
    return { statusCode: 403 };
}

export async function init(data: Data): Promise<Data> {
    const { email } = data.request.body as UserInitModel
    data.state.private = {
        email,
        userId: data.context.instanceId
    } as PrivateState
    await rdk.setLookUpKey({ key: { name: 'email', value: email } })
    return data
}

export async function getState(data: Data): Promise<Response> {
    return { statusCode: 200, body: data.state };
}

export async function getInstanceId(): Promise<string> {
    return uuidv4()
}

export async function getProfile(data: Data): Promise<Data> {
    data.response = {
        statusCode: 200,
        body: data.state.private,
    };
    return data;
}

