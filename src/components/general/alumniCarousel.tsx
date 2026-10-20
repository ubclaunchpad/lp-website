import Image from "next/image";

export default function AlumniCarousel() {
  return (
    <div className="logo-marquee w-full overflow-hidden py-4">
      {/* The list is rendered twice so the track can loop seamlessly by
          sliding exactly half its width. Items use padding instead of a flex
          gap so both halves are the same width. */}
      <div className="logo-marquee-track flex items-center w-max h-20">
        {[false, true].map((isDuplicate) =>
          companies.map((company) => (
            <div
              key={`${company.name}${isDuplicate ? "-duplicate" : ""}`}
              className="flex-shrink-0 px-8"
              aria-hidden={isDuplicate || undefined}
            >
              <a href={company.href} tabIndex={isDuplicate ? -1 : undefined}>
                <Image
                  src={`/images/company_logos/${company.logo}`}
                  alt={company.name}
                  width={company.width}
                  height={company.height}
                  className={`brightness-0 invert opacity-85 ${company.className ?? ""}`}
                />
              </a>
            </div>
          )),
        )}
      </div>
    </div>
  );
}

// Sizes match each SVG's aspect ratio and are tuned so wordmarks and
// icon-style logos look similar in visual weight. className is for optical
// alignment of logos whose box center isn't their visual center.
const companies: {
  name: string;
  href: string;
  logo: string;
  width: number;
  height: number;
  className?: string;
}[] = [
  {
    name: "Google",
    href: "https://www.google.com/",
    logo: "google.svg",
    width: 115,
    height: 77,
  },
  {
    name: "Microsoft",
    href: "https://www.microsoft.com/",
    logo: "microsoft.svg",
    width: 159,
    height: 34,
  },
  {
    name: "Apple",
    href: "https://www.apple.com/",
    logo: "apple.svg",
    width: 43,
    height: 53,
  },
  {
    name: "Amazon",
    href: "https://www.amazon.ca/",
    logo: "amazon.svg",
    width: 126,
    height: 38,
    // The smile hangs below the wordmark, so center on the text instead
    className: "translate-y-2",
  },
  {
    name: "Meta",
    href: "https://www.meta.com/",
    logo: "meta.svg",
    width: 144,
    height: 29,
  },
  {
    name: "OpenAI",
    href: "https://www.openai.com/",
    logo: "openai.svg",
    width: 125,
    height: 34,
  },
  {
    name: "Tesla",
    href: "https://www.tesla.com/",
    logo: "tesla.svg",
    width: 45,
    height: 58,
  },
  {
    name: "Bloomberg",
    href: "https://www.bloomberg.com/",
    logo: "bloomberg.svg",
    width: 144,
    height: 29,
  },
  {
    name: "Stripe",
    href: "https://www.stripe.com/",
    logo: "stripe.svg",
    width: 91,
    height: 38,
  },
  {
    name: "Datadog",
    href: "https://www.datadoghq.com/",
    logo: "datadog.svg",
    width: 150,
    height: 38,
  },
  {
    name: "Databricks",
    href: "https://www.databricks.com/",
    logo: "databricks.svg",
    width: 115,
    height: 48,
  },
  {
    name: "Figma",
    href: "https://www.figma.com/",
    logo: "figma.svg",
    width: 86,
    height: 32,
  },
];
