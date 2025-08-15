import { Response } from "../models/response";
import { StringResponse } from "../models/response/string.response";
import { CliUtils } from "../utils";

export class EncodeCommand {
  async run(): Promise<Response> {
    if (process.stdin.isTTY) {
      return Response.badRequest("No stdin was piped in.");
    }
    const input = await CliUtils.readStdin();
    const b64 = Buffer.from(input, "utf8").toString("base64");
    const res = new StringResponse(b64);
    return Response.success(res);
  }
}
