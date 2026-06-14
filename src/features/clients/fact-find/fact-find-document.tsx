import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { FactFindData } from "@/server/functions/fact-find";
import {
  dependantRelationshipLabel,
  beneficiaryRelationshipLabel,
  beneficiaryAppliesToLabel,
  healthStatusLabel,
  riskCategoryLabel,
} from "./schemas";

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

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
  row: { flexDirection: "row", paddingVertical: 2 },
  cellLabel: { width: "35%", color: "#6b7280" },
  cellValue: { width: "65%" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
    marginBottom: 2,
    color: "#6b7280",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  empty: { color: "#9ca3af", fontStyle: "italic" },
});

function KV({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value || "—"}</Text>
    </View>
  );
}

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

function Table({
  cols,
  rows,
  empty,
}: {
  cols: { label: string; width: string; align?: "right" }[];
  rows: (string | number)[][];
  empty: string;
}) {
  if (rows.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View>
      <View style={styles.tableHead}>
        {cols.map((col, i) => (
          <Text
            key={i}
            style={{
              width: col.width,
              textAlign: col.align ?? "left",
            }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={{
                width: cols[ci].width,
                textAlign: cols[ci].align ?? "left",
              }}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function buildFactFindDocument(c: FactFindData) {
  const fullName = [c.title, c.firstName, c.lastName].filter(Boolean).join(" ");
  const address = [c.streetAddress, c.suburb, c.state, c.postcode, c.country]
    .filter(Boolean)
    .join(", ");
  const generated = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`Fact Find — ${fullName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Fact Find</Text>
        <Text style={styles.subtitle}>
          {fullName} · Generated {generated}
        </Text>

        <Section title="Personal Details">
          <KV label="Date of Birth" value={c.dateOfBirth} />
          <KV label="Email" value={c.email} />
          <KV label="Phone" value={c.phone} />
          <KV label="Address" value={address} />
          <KV label="Occupation" value={c.occupation} />
          <KV label="Employer" value={c.employer} />
          <KV label="Tax File Number" value={c.taxFileNumber} />
        </Section>

        <Section title="Dependants">
          <Table
            cols={[
              { label: "Name", width: "40%" },
              { label: "Relationship", width: "30%" },
              { label: "Date of Birth", width: "30%" },
            ]}
            rows={c.dependants.map((d) => [
              d.name,
              dependantRelationshipLabel(d.relationship),
              d.dateOfBirth ?? "—",
            ])}
            empty="No dependants recorded."
          />
        </Section>

        <Section title="Assets">
          <Table
            cols={[
              { label: "Asset", width: "70%" },
              { label: "Value", width: "30%", align: "right" },
            ]}
            rows={c.assets.map((a) => [a.name, aud.format(a.value)])}
            empty="No assets recorded."
          />
        </Section>

        <Section title="Liabilities">
          <Table
            cols={[
              { label: "Liability", width: "70%" },
              { label: "Balance", width: "30%", align: "right" },
            ]}
            rows={c.liabilities.map((l) => [l.name, aud.format(l.balance)])}
            empty="No liabilities recorded."
          />
        </Section>

        <Section title="Income">
          <Table
            cols={[
              { label: "Source", width: "55%" },
              { label: "Amount", width: "25%", align: "right" },
              { label: "Frequency", width: "20%" },
            ]}
            rows={c.income.map((i) => [
              i.name,
              aud.format(i.amount),
              i.frequency,
            ])}
            empty="No income recorded."
          />
        </Section>

        <Section title="Expenses">
          <Table
            cols={[
              { label: "Expense", width: "55%" },
              { label: "Amount", width: "25%", align: "right" },
              { label: "Frequency", width: "20%" },
            ]}
            rows={c.expenses.map((e) => [
              e.name,
              aud.format(e.amount),
              e.frequency,
            ])}
            empty="No expenses recorded."
          />
        </Section>

        <Section title="Goals">
          <Table
            cols={[
              { label: "Goal", width: "70%" },
              { label: "Target", width: "30%", align: "right" },
            ]}
            rows={c.goals.map((g) => [
              g.name,
              g.targetAmount ? aud.format(g.targetAmount) : "—",
            ])}
            empty="No goals recorded."
          />
        </Section>

        <Section title="Insurance">
          <Table
            cols={[
              { label: "Insurer", width: "50%" },
              { label: "Type", width: "25%" },
              { label: "Cover", width: "25%", align: "right" },
            ]}
            rows={c.insurance.map((p) => [
              p.insurer,
              p.category,
              p.coverAmount ? aud.format(p.coverAmount) : "—",
            ])}
            empty="No insurance recorded."
          />
        </Section>

        <Section title="Estate Planning">
          <KV label="Has Will" value={c.estate?.hasWill ? "Yes" : "No"} />
          <KV label="Will Location" value={c.estate?.willLocation} />
          <KV label="Executor" value={c.estate?.executor} />
          <KV
            label="Power of Attorney"
            value={c.estate?.hasPoa ? c.estate.poaType ?? "Yes" : "No"}
          />
          <KV
            label="Guardianship"
            value={c.estate?.hasGuardianship ? "Yes" : "No"}
          />
        </Section>

        <Section title="Beneficiaries">
          <Table
            cols={[
              { label: "Name", width: "40%" },
              { label: "Relationship", width: "25%" },
              { label: "Applies To", width: "20%" },
              { label: "%", width: "15%", align: "right" },
            ]}
            rows={c.beneficiaries.map((b) => [
              b.name,
              beneficiaryRelationshipLabel(b.relationship),
              beneficiaryAppliesToLabel(b.appliesTo),
              b.allocation != null ? `${b.allocation}%` : "—",
            ])}
            empty="No beneficiaries recorded."
          />
        </Section>

        <Section title="Health">
          <KV
            label="Smoker"
            value={c.smoker == null ? "—" : c.smoker ? "Yes" : "No"}
          />
          <KV label="Health Status" value={healthStatusLabel(c.healthStatus)} />
          <KV
            label="Height"
            value={c.heightCm != null ? `${c.heightCm} cm` : null}
          />
          <KV
            label="Weight"
            value={c.weightKg != null ? `${c.weightKg} kg` : null}
          />
        </Section>

        <Section title="Risk Profile">
          <KV
            label="Risk Category"
            value={
              c.riskProfile
                ? riskCategoryLabel(
                    c.riskProfile.confirmedCategory ?? c.riskProfile.category,
                  )
                : null
            }
          />
        </Section>
      </Page>
    </Document>
  );
}
