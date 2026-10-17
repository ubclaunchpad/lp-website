import Link from "next/link";
import Image from "next/image";

type ImageCardProps = {
  title: string;
  description: string;
  imageSrc: string;
  alt: string;
  width: number;
  height: number;
  url: string;
};

const ImageCard = ({
  title,
  description,
  imageSrc,
  alt,
  width,
  height,
  url,
}: ImageCardProps) => {
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
      {/* Size the box to the image's own aspect ratio so it shows in full */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        className="w-full h-auto rounded-lg"
      />
    </Link>
  );
};

export default ImageCard;
