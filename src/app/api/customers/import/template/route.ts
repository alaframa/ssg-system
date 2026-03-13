// src/app/api/customers/import/template/route.ts
// Serves the customer import Excel template as a file download.
// Place the generated template at: public/templates/customer_import_template.xlsx

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join }         from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "templates", "customer_import_template.xlsx");
    const buffer   = readFileSync(filePath);

    return new NextResponse(buffer, {
      status:  200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="customer_import_template.xlsx"',
        "Content-Length":      String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }
}