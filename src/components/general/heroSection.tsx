import Hero from "@/components/general/hero";
import Statistics from "@/components/general/statistics";
import AlumniCarousel from "@/components/general/alumniCarousel";

export default function HeroSection() {
  return (
    <>
      <section className="flex flex-col items-center overflow-visible w-full gap-60 text-center">
        <Hero />
        <Statistics />
      </section>
      <AlumniSection />
    </>
  );
}

const text = {
  alum: "Our Alumni have worked as Developers, Designers, and more at",
};

function AlumniSection() {
  return (
    <div className="w-full max-w-[1340px] mx-auto px-8 pt-32 pb-8">
      {/* Same column and insets as the about section below, so the
                caption and logos span from the photo's left edge to the
                about text's right edge */}
      <div className="flex flex-col gap-3 px-10 lg:pr-12">
        <p>{text.alum}</p>
        <AlumniCarousel />
      </div>
    </div>
  );
}
