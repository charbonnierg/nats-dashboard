import type { Endpoint, ServerPingError, ServerPingResponse } from "~/types";

export function isError(r: ServerPingResponse<Endpoint> | ServerPingError): r is ServerPingError {
    return "error" in r;
}
