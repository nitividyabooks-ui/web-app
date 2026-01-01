import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        // PhonePe sends the response as a base64 encoded string in the body
        // However, for server-to-server callback, it might be x-www-form-urlencoded or json
        // Usually it sends a JSON with 'response' (base64) and 'X-VERIFY' header

        // Note: In some integrations, PhonePe sends data as form-data. 
        // We need to handle both or strictly follow the doc. 
        // Standard doc says JSON body: { response: "base64..." }

        const body = await req.json();
        const { response: base64Response } = body;
        const xVerify = req.headers.get("x-verify");

        if (!base64Response || !xVerify) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;

        if (!saltKey || !saltIndex) {
            return NextResponse.json({ error: "Server config error" }, { status: 500 });
        }

        // Verify Checksum
        const stringToSign = base64Response + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
        const calculatedChecksum = sha256 + "###" + saltIndex;

        if (calculatedChecksum !== xVerify) {
            return NextResponse.json({ error: "Checksum mismatch" }, { status: 400 });
        }

        // Decode Payload
        const decodedResponse = Buffer.from(base64Response, "base64").toString("utf-8");
        const responseData = JSON.parse(decodedResponse);

        console.log("Payment Callback Data:", responseData);

        if (responseData.success && responseData.code === "PAYMENT_SUCCESS") {
            // TODO: Update order status in database
            // const { merchantTransactionId, transactionId, amount } = responseData.data;
            // await db.order.update(...)

            return NextResponse.json({ status: "success" });
        } else {
            // Payment Failed
            return NextResponse.json({ status: "failed" });
        }

    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
