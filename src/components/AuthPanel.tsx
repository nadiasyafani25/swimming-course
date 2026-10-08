import { Waves } from "lucide-react";

type AuthPanelProps = {
  heading: string;
  description: string;
};

export default function AuthPanel({ heading, description }: AuthPanelProps) {
  return (
    <div className="flex flex-col justify-center bg-[#0A3966] px-5 py-14 sm:px-10 lg:w-1/2 lg:min-h-screen lg:px-14 xl:px-[55px] lg:py-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F8FE5]">
          <Waves className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
        </span>
        <span className="text-[16px] font-bold text-white">
          SwimmingCourse
        </span>
      </div>

      {/* Heading */}
      <h1 className="mt-8 text-[24px] font-bold leading-tight text-white lg:mt-10 lg:text-[28px]">
        {heading}
      </h1>

      {/* Deskripsi */}
      <p className="mt-4 max-w-[360px] text-[12px] leading-[1.7] text-[#8FC7F5]">
        {description}
      </p>
    </div>
  );
}