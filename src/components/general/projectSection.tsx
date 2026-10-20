"use client";
import InfoButton from "@/components/primitives/infoButton";
import { Button } from "@/components/primitives/button";
import ImageCard, { ImageCardProps } from "./imageCard";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type Project = ImageCardProps;

type ProjectSectionProps = {
  projects: Project[];
};

const text = {
  projectsTitle: "Project Highlights",
};

// Swiper breakpoints are min-widths: 1 slide up to 768px, 2 up to 900px, 3 up to 1280px, then 4
const carouselBreakpoints = {
  0: { slidesPerView: 1 },
  769: { slidesPerView: 2 },
  901: { slidesPerView: 3 },
  1281: { slidesPerView: 4 },
};

const ProjectSection = ({ projects }: ProjectSectionProps) => {
  return (
    <div className="flex flex-col text-center items-center justify-center md:justify-between py-10 w-full">
      <span className="flex flex-col md:flex-row text-center items-center justify-between md:px-10 py-10 w-full">
        <span className="flex flex-col-reverse md:flex-row items-center">
          <h1 className={`text-4xl font-bold font-sans py-2 md:py-0 md:pr-4`}>
            {text.projectsTitle}
          </h1>
        </span>
        <span className="hidden md:flex md:flex-row md:space-x-2">
          <Button variant={"dark"} className="swiper-button-prev gap-2">
            <ArrowLeft size={20} />
          </Button>
          <Button variant={"dark"} className="swiper-button-next gap-2">
            <ArrowRight size={20} />
          </Button>
        </span>
      </span>
      <span className="flex text-center items-center justify-between lg:px-10 py-10 w-full">
        <Swiper
          spaceBetween={10}
          breakpoints={carouselBreakpoints}
          loop={true}
          modules={[Navigation]}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
        >
          {projects.map((project, index) => (
            <SwiperSlide
              key={index}
              className="flex justify-center !h-auto p-4 w-auto"
            >
              <ImageCard {...project} />
            </SwiperSlide>
          ))}
        </Swiper>
      </span>
    </div>
  );
};

export default ProjectSection;
