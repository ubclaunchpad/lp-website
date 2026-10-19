import Link from "next/link";
import Image, { StaticImageData } from "next/image";

export type ImageCardProps = {
  title: string;
  description: string;
  image: StaticImageData;
  alt: string;
  url: string;
};

const ImageCard = ({ title, description, image, alt, url }: ImageCardProps) => {
  return (
    <Link
      className="flex flex-col flex-1 p-2 h-full justify-between bg-secondary hover:bg-lp-500 duration-200 hover:scale-105 rounded-2xl text-white items-center text-center"
      target="_blank"
      rel="noopener noreferrer"
      href={url}
    >
      <div className="py-8 w-full">
        <h2 className="text-xl font-normal pb-6">{title}</h2>
        <p className="font-extralight leading-6 min-h-[4.5rem] line-clamp-3 px-2">
          {description}
        </p>
      </div>
      {/* The static import carries the image's own width and height, so the box keeps its aspect ratio and shows it in full */}
      <Image
        src={image}
        alt={alt}
        unoptimized
        className="w-full h-auto rounded-lg"
      />
    </Link>
  );
};

export default ImageCard;
