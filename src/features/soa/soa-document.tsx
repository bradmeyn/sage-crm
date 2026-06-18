import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { strategyCategoryLabel } from "./schemas";
import { recommendationDataLines, type SoaExportData } from "./export-data";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1c1f", fontFamily: "Helvetica" },
  title: { fontSize: 20, fontFamily: "Times-Roman", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 18 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  para: { lineHeight: 1.4, marginBottom: 4 },
  row: { flexDirection: "row", paddingVertical: 2 },
  cellLabel: { width: "35%", color: "#6b7280" },
  cellValue: { width: "65%" },
  rec: { marginBottom: 14 },
  recHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  recTitle: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  recCategory: { fontSize: 9, color: "#6b7280" },
  subHead: {
    marginTop: 4,
    marginBottom: 2,
    fontSize: 9,
    color: "#6b7280",
    fontFamily: "Helvetica-Bold",
  },
  bullet: { flexDirection: "row", paddingVertical: 1 },
  bulletDot: { width: 10 },
  empty: { color: "#9ca3af", fontStyle: "italic" },
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ points }: { points: string[] }) {
  return (
    <View>
      {points.map((p, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={{ flex: 1 }}>{p}</Text>
        </View>
      ))}
    </View>
  );
}

export function buildSoaDocument(d: SoaExportData) {
  const generated = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`${d.title} — ${d.clientName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{d.title}</Text>
        <Text style={styles.subtitle}>
          {d.clientName} · Generated {generated}
        </Text>

        <Section title="Overview">
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Risk profile</Text>
            <Text style={styles.cellValue}>{d.riskCategory || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Goals</Text>
            <Text style={styles.cellValue}>
              {d.goalNames.length ? d.goalNames.join(", ") : "—"}
            </Text>
          </View>
        </Section>

        {d.scope ? (
          <Section title="Scope of advice">
            <Text style={styles.para}>{d.scope}</Text>
          </Section>
        ) : null}

        {d.intro ? (
          <Section title="Introduction">
            <Text style={styles.para}>{d.intro}</Text>
          </Section>
        ) : null}

        <Section title="Recommendations">
          {d.recommendations.length === 0 ? (
            <Text style={styles.empty}>No recommendations.</Text>
          ) : (
            d.recommendations.map((r, i) => {
              const lines = recommendationDataLines(r.type, r.data);
              return (
                <View key={i} style={styles.rec} wrap={false}>
                  <View style={styles.recHead}>
                    <Text style={styles.recTitle}>
                      {i + 1}. {r.title}
                    </Text>
                    <Text style={styles.recCategory}>
                      {strategyCategoryLabel(r.category)}
                    </Text>
                  </View>
                  {r.wording ? <Text style={styles.para}>{r.wording}</Text> : null}
                  {lines.map((l, li) => (
                    <View key={li} style={styles.row}>
                      <Text style={styles.cellLabel}>{l.label}</Text>
                      <Text style={styles.cellValue}>{l.value}</Text>
                    </View>
                  ))}
                  {r.benefits.length > 0 ? (
                    <>
                      <Text style={styles.subHead}>Benefits</Text>
                      <Bullets points={r.benefits} />
                    </>
                  ) : null}
                  {r.warnings.length > 0 ? (
                    <>
                      <Text style={styles.subHead}>Things to consider</Text>
                      <Bullets points={r.warnings} />
                    </>
                  ) : null}
                  {r.goalNames.length > 0 ? (
                    <Text style={[styles.recCategory, { marginTop: 3 }]}>
                      Linked goals: {r.goalNames.join(", ")}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </Section>
      </Page>
    </Document>
  );
}
