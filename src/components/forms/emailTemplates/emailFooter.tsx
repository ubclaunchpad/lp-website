import { Hr, Link, Text } from "@react-email/components";

// Inline styles: email clients ignore stylesheets and class names.
const muted = { color: "#6b7280", fontSize: "13px", lineHeight: "20px" };

// Shared sign-off appended to every email the site sends.
export function EmailFooter() {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
      <Text style={{ ...muted, fontWeight: 600, margin: 0 }}>UBC Launch Pad</Text>
      <Text style={{ ...muted, margin: 0 }}>
        <Link href="mailto:team@ubclaunchpad.com" style={muted}>
          team@ubclaunchpad.com
        </Link>
        {" | "}
        <Link href="https://www.ubclaunchpad.com" style={muted}>
          ubclaunchpad.com
        </Link>
      </Text>
    </>
  );
}
