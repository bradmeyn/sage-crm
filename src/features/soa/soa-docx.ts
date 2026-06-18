import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { strategyCategoryLabel } from "./schemas";
import { recommendationDataLines, type SoaExportData } from "./export-data";

const muted = "6B7280";

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text })],
  });
}

function para(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text })],
  });
}

function labelValue(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: `${label}: `, color: muted }),
      new TextRun({ text: value }),
    ],
  });
}

function subHead(text: string) {
  return new Paragraph({
    spacing: { before: 80, after: 20 },
    children: [new TextRun({ text, bold: true, size: 18, color: muted })],
  });
}

function bullets(points: string[]) {
  return points.map(
    (p) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: p })],
      }),
  );
}

/** Editable Word version of the SOA, mirroring the PDF document. */
export function buildSoaDocx(d: SoaExportData) {
  const generated = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: d.title })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${d.clientName} · Generated ${generated}`,
          color: muted,
        }),
      ],
    }),
    heading("Overview"),
    labelValue("Risk profile", d.riskCategory || "—"),
    labelValue("Goals", d.goalNames.length ? d.goalNames.join(", ") : "—"),
  ];

  if (d.scope) {
    children.push(heading("Scope of advice"), para(d.scope));
  }
  if (d.intro) {
    children.push(heading("Introduction"), para(d.intro));
  }

  children.push(heading("Recommendations"));
  if (d.recommendations.length === 0) {
    children.push(para("No recommendations."));
  } else {
    d.recommendations.forEach((r, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: `${i + 1}. ${r.title}`, bold: true, size: 24 }),
            new TextRun({
              text: `   ${strategyCategoryLabel(r.category)}`,
              color: muted,
            }),
          ],
        }),
      );
      if (r.wording) children.push(para(r.wording));
      for (const l of recommendationDataLines(r.type, r.data)) {
        children.push(labelValue(l.label, l.value));
      }
      if (r.benefits.length) {
        children.push(subHead("Benefits"), ...bullets(r.benefits));
      }
      if (r.warnings.length) {
        children.push(subHead("Things to consider"), ...bullets(r.warnings));
      }
      if (r.goalNames.length) {
        children.push(
          new Paragraph({
            spacing: { before: 40 },
            children: [
              new TextRun({
                text: `Linked goals: ${r.goalNames.join(", ")}`,
                italics: true,
                color: muted,
              }),
            ],
          }),
        );
      }
    });
  }

  return new Document({ sections: [{ children }] });
}
