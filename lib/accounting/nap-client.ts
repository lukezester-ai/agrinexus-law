export type NapConfig = {
  environment: "test" | "production";
  username?: string;
  password?: string;
  certificatePem?: string;
  certificateKey?: string;
};

export type NapSubmitResult = {
  success: boolean;
  napUuid?: string;
  napStatus?: string;
  error?: string;
  rawResponse?: string;
};

export type NapStatusResult = {
  success: boolean;
  status?: string;
  rejectionReason?: string;
  rawResponse?: string;
};

const NAP_URLS = {
  test: "https://efaktura.nalog.bg/test/ws/",
  production: "https://efaktura.nalog.bg/ws/",
};

function buildSoapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ws="http://www.nalog.bg/webservices/">
  <soap:Header/>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
}

function buildSubmitInvoiceRequest(invoice: {
  invoiceNumber: string;
  issueDate: string;
  taxDate: string;
  clientName: string;
  clientEik: string;
  clientVatNumber: string;
  clientAddress: string;
  totalAmount: string;
  vatAmount: string;
  vatRate: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  isDebitNote?: boolean;
  isCreditNote?: boolean;
}): string {
  const docType = invoice.isCreditNote ? "credit_note" : invoice.isDebitNote ? "debit_note" : "invoice";
  const itemsXml = invoice.items.map((item, i) => `
      <Item>
        <LineNumber>${i + 1}</LineNumber>
        <Name><![CDATA[${item.name}]]></Name>
        <Quantity>${item.quantity}</Quantity>
        <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
        <TotalAmount>${item.total.toFixed(2)}</TotalAmount>
      </Item>`).join("");

  return `<ws:SubmitInvoiceRequest>
    <Invoice>
      <DocumentType>${docType}</DocumentType>
      <InvoiceNumber>${invoice.invoiceNumber}</InvoiceNumber>
      <IssueDate>${invoice.issueDate}</IssueDate>
      <TaxDate>${invoice.taxDate}</TaxDate>
      <Buyer>
        <Name><![CDATA[${invoice.clientName}]]></Name>
        <EIK>${invoice.clientEik}</EIK>
        <VATNumber>${invoice.clientVatNumber}</VATNumber>
        <Address><![CDATA[${invoice.clientAddress}]]></Address>
      </Buyer>
      <Items>${itemsXml}
      </Items>
      <Totals>
        <TotalAmount>${invoice.totalAmount}</TotalAmount>
        <VATAmount>${invoice.vatAmount}</VATAmount>
        <VATRate>${invoice.vatRate}</VATRate>
      </Totals>
    </Invoice>
  </ws:SubmitInvoiceRequest>`;
}

function buildStatusRequest(napUuid: string): string {
  return `<ws:GetInvoiceStatusRequest>
    <UUID>${napUuid}</UUID>
  </ws:GetInvoiceStatusRequest>`;
}

function parseSoapResponse(xml: string): { status?: string; uuid?: string; error?: string } {
  const uuidMatch = xml.match(/<UUID>([^<]+)<\/UUID>/);
  const statusMatch = xml.match(/<Status>([^<]+)<\/Status>/);
  const errorMatch = xml.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/);
  const faultMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/);

  return {
    uuid: uuidMatch?.[1],
    status: statusMatch?.[1],
    error: errorMatch?.[1] || faultMatch?.[1],
  };
}

function escXml(s: any): string {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export class NapSoapClient {
  private config: NapConfig;

  constructor(config: NapConfig) {
    this.config = config;
  }

  private getEndpoint(): string {
    return NAP_URLS[this.config.environment];
  }

  private async sendSoapRequest(bodyXml: string): Promise<string> {
    const envelope = buildSoapEnvelope(bodyXml);
    const endpoint = this.getEndpoint();

    const headers: Record<string, string> = {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": "",
    };

    if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    const https = await import("node:https");
    const http = await import("node:http");

    const agent = this.config.certificatePem && this.config.certificateKey
      ? new https.Agent({
          cert: this.config.certificatePem,
          key: this.config.certificateKey,
          rejectUnauthorized: false,
        })
      : undefined;

    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const lib = url.protocol === "https:" ? https : http;
      const options: any = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(envelope).toString() },
        rejectUnauthorized: false,
      };
      if (agent) options.agent = agent;

      const req = lib.request(options, (res: any) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.write(envelope);
      req.end();
    });
  }

  async submitInvoice(invoice: Parameters<typeof buildSubmitInvoiceRequest>[0]): Promise<NapSubmitResult> {
    try {
      const bodyXml = buildSubmitInvoiceRequest(invoice);
      const responseXml = await this.sendSoapRequest(bodyXml);
      const parsed = parseSoapResponse(responseXml);

      if (parsed.error) {
        return { success: false, error: parsed.error, rawResponse: responseXml };
      }

      return {
        success: true,
        napUuid: parsed.uuid,
        napStatus: parsed.status || "submitted",
        rawResponse: responseXml,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getInvoiceStatus(napUuid: string): Promise<NapStatusResult> {
    try {
      const bodyXml = buildStatusRequest(napUuid);
      const responseXml = await this.sendSoapRequest(bodyXml);
      const parsed = parseSoapResponse(responseXml);

      if (parsed.error) {
        return { success: false, rejectionReason: parsed.error, rawResponse: responseXml };
      }

      return {
        success: true,
        status: parsed.status,
        rawResponse: responseXml,
      };
    } catch (err: any) {
      return { success: false, rejectionReason: err.message };
    }
  }
}

export function buildNapInvoiceFromDbRecord(record: {
  invoiceNumber: string;
  issueDate: string;
  clientName: string;
  clientEik: string;
  clientVatNumber: string;
  clientAddress: string;
  totalAmount: string;
  vatAmount: string;
  vatRate: string;
  items: any;
}): Parameters<typeof buildSubmitInvoiceRequest>[0] {
  const parsedItems = typeof record.items === "string" ? JSON.parse(record.items) : record.items || [];
  return {
    invoiceNumber: record.invoiceNumber,
    issueDate: record.issueDate.slice(0, 10),
    taxDate: record.issueDate.slice(0, 10),
    clientName: record.clientName || "",
    clientEik: record.clientEik || "",
    clientVatNumber: record.clientVatNumber || "",
    clientAddress: record.clientAddress || "",
    totalAmount: record.totalAmount,
    vatAmount: record.vatAmount,
    vatRate: record.vatRate,
    items: Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
      name: item.name || item.product || "",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice || item.price || 0),
      total: Number(item.total || 0),
    })) : [],
  };
}
