import { Hr, Img, Link, Text } from "@react-email/components";

// Inline styles: email clients ignore stylesheets and class names.
const muted = { color: "#6b7280", fontSize: "13px", lineHeight: "20px" };

// Must be an absolute URL (emails can't resolve relative paths) and a PNG,
// since Gmail and Outlook don't render SVG.
const LOGO_URL = "https://www.ubclaunchpad.com/images/email_logo.png";

// Shared sign-off appended to every email the site sends.
export function EmailFooter() {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
      <Img
        src={LOGO_URL}
        alt="UBC Launch Pad"
        width="96"
        height="92"
        style={{ margin: "0 0 8px" }}
      />
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
