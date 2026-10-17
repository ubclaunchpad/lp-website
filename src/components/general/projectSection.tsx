"use client";
import InfoButton from "@/components/primitives/infoButton";
import { Button } from "@/components/primitives/button";
import ImageCard from "./imageCard";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import useIsMobile from "@/app/lib/hooks/useIsMobile";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

type ProjectSectionProps = {
  projects: Project[];
};

type Project = {
  title: string;
  description: string;
  imageSrc: string;
  alt: string;
  width: number;
  height: number;
  url: string;
};

const text = {
  projectsTitle: "Project Highlights",
};

const ProjectSection = ({ projects }: ProjectSectionProps) => {
  const SMALL_DESKTOP_SIZE = 1280;
  const TABLET_SIZE = 900;
  const MOBILE_SIZE = 768;
  const isSmallDesktop = useIsMobile(SMALL_DESKTOP_SIZE);
  const isTablet = useIsMobile(TABLET_SIZE);
  const isMobile = useIsMobile(MOBILE_SIZE);
  const carouselSize = useMemo(() => {
    if (isTablet) {
      return 2;
    } else if (isMobile) {
      return 1;
    } else if (isSmallDesktop) {
      return 3;
    } else {
      return 4;
    }
  }, [isSmallDesktop, isTablet, isMobile]);
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
          slidesPerView={carouselSize} // use only 1 slide carousel for mobile
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
