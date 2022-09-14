import {
  CUSTOM_RPC_ERROR_CODE,
  RPC_ERROR_CODE,
} from "../structures/Transport.ts";

export class RPCError extends Error {
  code: RPC_ERROR_CODE | CUSTOM_RPC_ERROR_CODE;
  message = "";

  get name() {
    return `${{ ...CUSTOM_RPC_ERROR_CODE, ...RPC_ERROR_CODE }[this.code]}`;
  }

  constructor(
    errorCode: CUSTOM_RPC_ERROR_CODE | RPC_ERROR_CODE,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.code = errorCode;
    this.message = message ?? this.message;
  }
}
