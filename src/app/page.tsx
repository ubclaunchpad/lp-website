import Navbar from "@/components/layouts/navbar";
import { nunitoSans } from "./fonts";
import ImageArea from "@/components/general/imageArea";
import Link from "next/link";
import FaqSection from "@/components/general/faqSection";
import MailingList from "@/components/general/mailingList";
import ExecSection from "@/components/general/execSection";
import FooterSection from "@/components/general/footerSection";
import InfoButton from "@/components/primitives/infoButton";
import { faqs, navItems, projects } from "@/lib/data/generalData";
import { Button } from "@/components/primitives/button";
import HeroSection from "@/components/general/heroSection";
import MemberRoles from "@/components/general/memberRoles";
import ProjectSection from "@/components/general/projectSection";
import PartnerSection from "@/components/general/partnerSection";

const text = {
  aboutUsTitle: "What we do at",
  aboutUsSubtitle: "Launch Pad",
  aboutUsText: `As the leading technology club at UBC, Launch Pad is devoted to create a collaborative and professional environment for software development. It is our goal to provide the best space for students to apply and develop their technical skills outside of classroom, to learn and practice industry-standard tools, and to build passion projects with like-minded individuals.
   
  In Launch Pad form into teams to work on an 8 month development project based on their interests and skill sets. Each team consists of a tech-lead, developers and designers, where they collaboratively go through the design thinking process to design and build a product.`,
  joinUsTitle: "Want to grow your skill?",
  joinUsSubtitle: "Join Our Team!",
  joinUsText:
    "We are looking for students passionate about tech with varying levels of experience to join our teams! ",
  joinUsButton: "Join Our Team",
  partnerWithUsTitle: "Partner with us 🤝",
  partnerWithUsSubtitle:
    "Reach out to us through email or social media! You can also connect with us through strategy@ubclaunchpad.com",
  partnerWithUsButton: "Contact us",
};

const lpImageProps = {
  src: "/images/launchpadTeam.jpg",
  alt: "Launchpad team posing for a photo",
  width: 998 * 2,
  height: 580 * 2,
};

export default async function Home() {
  // const projects = await refreshProjects();
  return (
    <main className="flex min-h-screen flex-col items-center max-w-screen overflow-x-hidden pt-0 md:pt-24 lg:pt-28">
      <div className="w-full flex justify-end">
        <Navbar navItems={navItems} />
      </div>

      <HeroSection />
      <section
        className="flex flex-col lg:flex-row max-w-[1340px] items-center  px-8 w-full"
        id={"about"}
      >
        <div>
          <ImageArea {...lpImageProps} />
        </div>
        <div className="flex flex-col items-center lg:items-end py-10 pl-0 lg:pl-10 pr-0 md:pr-6 lg:pr-12 w-full">
          <InfoButton text={"About us"} />
          <h1
            className={`text-4xl font-bold ${nunitoSans.variable} font-sans pt-5`}
          >
            {text.aboutUsTitle}
          </h1>
          <h1
            className={`text-4xl font-bold ${nunitoSans.variable} font-sans text-indigo-400 break-all`}
          >
            {text.aboutUsSubtitle}
          </h1>
          <p className="gradient-subtitle text-center lg:text-right py-10 whitespace-pre-wrap text-balance max-w-lg">
            {text.aboutUsText}
          </p>
        </div>
      </section>

      <section className="flex flex-col md:flex-row items-start justify-between max-w-[1340px] px-8 w-full">
        <div className="flex flex-col text-center items-center lg:items-start py-10 pl-0 lg:pl-10 md:pr-10 w-full">
          <h1
            className={`text-4xl font-bold ${nunitoSans.variable} font-sans pt-5`}
          >
            {text.joinUsTitle}
          </h1>
          <h1
            className={`text-4xl font-bold ${nunitoSans.variable} font-sans text-indigo-400`}
          >
            {text.joinUsSubtitle}
          </h1>
          <p className="gradient-subtitle text-center lg:text-left py-10">
            {text.joinUsText}
          </p>
          <Link href="/portal/forms/19">
            <Button className="p-4" size={"xl"} icon>
              <span className="text-lg">{text.joinUsButton}</span>
            </Button>
          </Link>
        </div>
        <MemberRoles />
      </section>

      <section
        className="flex flex-col lg:flex-row items-start justify-between max-w-[1740px] px-8 w-full lg:space-x-10"
        id={"projects"}
      >
        <ProjectSection projects={projects ?? []} />
      </section>
      <section className="flex pb-8 flex-col md:flex-row items-start justify-between max-w-[1740px] px-8 w-full">
        <div className="flex flex-col text-center items-center lg:items-start py-10 pl-0 lg:pl-10 md:pr-10 w-full">
          <h1
            className={`text-4xl font-bold ${nunitoSans.variable} font-sans pt-5`}
          >
            {text.partnerWithUsTitle}
          </h1>
          <p className="text-white text-center lg:text-left py-10">
            {text.partnerWithUsSubtitle}
          </p>
          <Link href="/contact-us">
            <Button className="p-3" size={"xl"} icon>
              <span className="text-lg px-4">{text.partnerWithUsButton}</span>
            </Button>
          </Link>
        </div>
        <PartnerSection />
      </section>
      <FaqSection faqs={faqs} />
      <MailingList />
      <ExecSection />
      <FooterSection />
    </main>
  );
}
